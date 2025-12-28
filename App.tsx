import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import Sidebar from './src/components/Sidebar';
import BranchDetails from './src/components/BranchDetails';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import type { Repo } from './src/types';
import { loadState, saveState } from './src/storage';
import { scanRepo, scanBranch, pickFolder } from './src/gitLocal';
import { useTheme } from './src/hooks/useTheme';
import { useLoading } from './src/hooks/useLoading';
import {
  commentsReducer,
  type CommentAction,
} from './src/state/commentsReducer';

function App() {
  const { isDark: isDarkMode, colors } = useTheme();
  const {
    isLoading,
    message: loadingMessage,
    startLoading,
    updateMessage,
    stopLoading,
  } = useLoading();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | undefined>(
    undefined,
  );
  const [selectedBranchName, setSelectedBranchName] = useState<
    string | undefined
  >(undefined);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const selectedRepo = useMemo(
    () => repos.find(r => r.id === selectedRepoId),
    [repos, selectedRepoId],
  );

  // Comment management via reducer
  const dispatchCommentAction = useCallback((action: CommentAction) => {
    setRepos(prev => commentsReducer(prev, action));
  }, []);

  const addLineComment = useCallback(
    (filePath: string, lineNumber: number, body: string, parentId?: string) => {
      if (!selectedRepoId || !selectedBranchName) return;
      dispatchCommentAction({
        type: 'ADD_LINE_COMMENT',
        payload: {
          repoId: selectedRepoId,
          branchName: selectedBranchName,
          filePath,
          lineNumber,
          body,
          parentId,
        },
      });
    },
    [selectedRepoId, selectedBranchName, dispatchCommentAction],
  );

  const editLineComment = useCallback(
    (filePath: string, lineNumber: number, commentId: string, body: string) => {
      if (!selectedRepoId || !selectedBranchName) return;
      dispatchCommentAction({
        type: 'EDIT_LINE_COMMENT',
        payload: {
          repoId: selectedRepoId,
          branchName: selectedBranchName,
          filePath,
          lineNumber,
          commentId,
          body,
        },
      });
    },
    [selectedRepoId, selectedBranchName, dispatchCommentAction],
  );

  const deleteLineComment = useCallback(
    (filePath: string, lineNumber: number, commentId: string) => {
      if (!selectedRepoId || !selectedBranchName) return;
      dispatchCommentAction({
        type: 'DELETE_LINE_COMMENT',
        payload: {
          repoId: selectedRepoId,
          branchName: selectedBranchName,
          filePath,
          lineNumber,
          commentId,
        },
      });
    },
    [selectedRepoId, selectedBranchName, dispatchCommentAction],
  );

  const toggleResolveLineComment = useCallback(
    (filePath: string, lineNumber: number) => {
      if (!selectedRepoId || !selectedBranchName) return;
      dispatchCommentAction({
        type: 'TOGGLE_RESOLVE_LINE_COMMENT',
        payload: {
          repoId: selectedRepoId,
          branchName: selectedBranchName,
          filePath,
          lineNumber,
        },
      });
    },
    [selectedRepoId, selectedBranchName, dispatchCommentAction],
  );

  const onToggleRepo = useCallback((id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const onSelectRepo = useCallback((id: string) => {
    setSelectedRepoId(id);
  }, []);

  const onSelectBranch = useCallback(
    async (id: string, br: string) => {
      setSelectedRepoId(id);
      setSelectedBranchName(br);

      // Lazy load branch data if not already loaded
      const repo = repos.find(r => r.id === id);
      if (repo && !repo.branchCommits?.[br] && repo.path && repo.baseBranch) {
        startLoading(`Loading branch: ${br}`);
        try {
          const branchData = await scanBranch(repo.path, br, repo.baseBranch);
          setRepos(prev =>
            prev.map(r =>
              r.id === id
                ? {
                    ...r,
                    branchCommits: {
                      ...r.branchCommits,
                      [br]: branchData.commits,
                    },
                    branchFiles: {
                      ...r.branchFiles,
                      [br]: branchData.files,
                    },
                  }
                : r,
            ),
          );
        } catch (e) {
          console.error('Failed to load branch data:', e);
          Alert.alert(
            'Failed to Load Branch',
            `Could not load branch "${br}": ${
              e instanceof Error ? e.message : String(e)
            }\n\nPlease check that the repository is accessible.`,
          );
        } finally {
          stopLoading();
        }
      }
    },
    [repos, startLoading, stopLoading],
  );

  useEffect(() => {
    const persisted = loadState();
    if (persisted) {
      setRepos(persisted.repos || []);
      setSelectedRepoId(persisted.selectedRepoId);
      setSelectedBranchName(persisted.selectedBranchName);
      setCollapsed(persisted.collapsed ?? {});
    }
  }, []);

  useEffect(() => {
    saveState({
      repos,
      selectedRepoId,
      selectedBranchName,
      collapsed,
    });
  }, [repos, selectedRepoId, selectedBranchName, collapsed]);

  const addLocalRepo = async () => {
    try {
      startLoading('Select a repository folder...');
      const path = await pickFolder();

      if (!path) {
        stopLoading();
        return; // User cancelled
      }

      startLoading('Step 1/6: Validating git repository...');
      const nameSegs = path.split(/[\\/]/).filter(Boolean);
      const name = nameSegs[nameSegs.length - 1] || path;

      await new Promise<void>(resolve => setTimeout(() => resolve(), 50));

      const scan = await scanRepo(path, (step: string) => {
        updateMessage(step);
      });

      if (
        !scan ||
        !Array.isArray(scan.branches) ||
        scan.branches.length === 0
      ) {
        stopLoading();
        Alert.alert(
          'Invalid Repository',
          'The selected folder is not a valid Git repository or has no branches.',
        );
        return;
      }

      updateMessage('Finalizing...');
      await new Promise<void>(resolve => setTimeout(() => resolve(), 100));

      const newRepo: Repo = {
        id: `local:${Date.now()}`,
        name,
        path,
        baseBranch: scan.baseBranch,
        pullRequests: [],
        branches: scan.branches,
        branchCommits: scan.branchCommits,
        branchFiles: scan.branchFiles,
      };

      setRepos(prev => [...prev, newRepo]);
      setSelectedRepoId(newRepo.id);
      setSelectedBranchName(scan.currentBranch);
      setCollapsed(prev => ({ ...prev, [newRepo.id]: false }));

      updateMessage('Done!');
      await new Promise<void>(resolve => setTimeout(() => resolve(), 300));

      stopLoading();
    } catch (e) {
      stopLoading();
      console.error('Failed to add repository:', e);
      Alert.alert(
        'Error',
        `Failed to add repository: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.windowBg }]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingBox,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(45, 45, 45, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDarkMode ? '#3e3e3e' : '#e5e5e5',
              },
            ]}
          >
            <ActivityIndicator
              size="large"
              color={isDarkMode ? '#4fc1ff' : '#007acc'}
            />
            <Text
              style={[
                styles.loadingText,
                { color: isDarkMode ? '#cccccc' : '#333333' },
              ]}
            >
              {loadingMessage}
            </Text>
          </View>
        </View>
      )}
      <ErrorBoundary componentName="Sidebar">
        <Sidebar
          repos={repos}
          selectedRepoId={selectedRepoId}
          selectedBranchName={selectedBranchName}
          collapsed={collapsed}
          onToggleRepo={onToggleRepo}
          onSelectRepo={onSelectRepo}
          onSelectBranch={onSelectBranch}
          onAddRepo={addLocalRepo}
        />
      </ErrorBoundary>
      <ErrorBoundary componentName="BranchDetails">
        <View style={styles.main}>
          <BranchDetails
            branchName={selectedBranchName}
            baseBranch={selectedRepo?.baseBranch}
            commits={
              selectedBranchName
                ? selectedRepo?.branchCommits?.[selectedBranchName]
                : undefined
            }
            files={
              selectedBranchName
                ? selectedRepo?.branchFiles?.[selectedBranchName]
                : undefined
            }
            repoId={selectedRepoId}
            lineComments={selectedRepo?.reviewComments}
            onAddComment={addLineComment}
            onEditComment={editLineComment}
            onDeleteComment={deleteLineComment}
            onToggleResolve={toggleResolveLineComment}
          />
        </View>
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  main: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 280,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default App;
