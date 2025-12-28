import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Sidebar from './src/components/Sidebar';
import PRDetails from './src/components/PRDetails';
import BranchDetails from './src/components/BranchDetails';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import type {
  Repo,
  PullRequest,
  LineComments,
  ReviewComment,
} from './src/types';
import { loadState, saveState } from './src/storage';
import { scanRepo, scanBranch, pickFolder } from './src/gitLocal';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | undefined>(
    undefined,
  );
  const [selectedPrId, setSelectedPrId] = useState<string | undefined>(
    undefined,
  );
  const [selectedBranchName, setSelectedBranchName] = useState<
    string | undefined
  >(undefined);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const selectedRepo = useMemo(
    () => repos.find(r => r.id === selectedRepoId),
    [repos, selectedRepoId],
  );
  const selectedPr: PullRequest | undefined = useMemo(() => {
    const repo = selectedRepo;
    return repo?.pullRequests.find(p => p.id === selectedPrId);
  }, [selectedRepo, selectedPrId]);

  const addComment = useCallback(
    (body: string) => {
      setRepos(prev =>
        prev.map(r => {
          if (r.id !== selectedRepoId) return r;
          return {
            ...r,
            pullRequests: r.pullRequests.map(p => {
              if (p.id !== selectedPrId) return p;
              const newComment = {
                id: Math.random().toString(36).slice(2),
                author: 'you',
                body,
                createdAt: new Date().toISOString(),
              };
              return {...p, comments: [...p.comments, newComment]};
            }),
          };
        }),
      );
    },
    [selectedRepoId, selectedPrId],
  );

  const addLineComment = useCallback(
    (filePath: string, lineNumber: number, body: string, parentId?: string) => {
      if (!selectedRepoId || !selectedBranchName) return;

      setRepos(prev =>
        prev.map(r => {
          if (r.id !== selectedRepoId) return r;

          const newComment: ReviewComment = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            body,
            createdAt: new Date().toISOString(),
            parentId,
          };

          const existingComments = r.reviewComments || [];
          const existingLineComment = existingComments.find(
            lc =>
              lc.repoId === selectedRepoId &&
              lc.branchName === selectedBranchName &&
              lc.filePath === filePath &&
              lc.lineNumber === lineNumber,
          );

          let updatedComments: LineComments[];
          if (existingLineComment) {
            updatedComments = existingComments.map(lc =>
              lc === existingLineComment
                ? {...lc, comments: [...lc.comments, newComment]}
                : lc,
            );
          } else {
            updatedComments = [
              ...existingComments,
              {
                repoId: selectedRepoId,
                branchName: selectedBranchName,
                filePath,
                lineNumber,
                comments: [newComment],
              },
            ];
          }

          return {...r, reviewComments: updatedComments};
        }),
      );
    },
    [selectedRepoId, selectedBranchName],
  );

  const editLineComment = useCallback(
    (filePath: string, lineNumber: number, commentId: string, body: string) => {
      if (!selectedRepoId || !selectedBranchName) return;

      setRepos(prev =>
        prev.map(r => {
          if (r.id !== selectedRepoId) return r;

          const updatedComments = (r.reviewComments || []).map(lc => {
            if (
              lc.repoId === selectedRepoId &&
              lc.branchName === selectedBranchName &&
              lc.filePath === filePath &&
              lc.lineNumber === lineNumber
            ) {
              return {
                ...lc,
                comments: lc.comments.map(c =>
                  c.id === commentId
                    ? {...c, body, updatedAt: new Date().toISOString()}
                    : c,
                ),
              };
            }
            return lc;
          });

          return {...r, reviewComments: updatedComments};
        }),
      );
    },
    [selectedRepoId, selectedBranchName],
  );

  const deleteLineComment = useCallback(
    (filePath: string, lineNumber: number, commentId: string) => {
      if (!selectedRepoId || !selectedBranchName) return;

      setRepos(prev =>
        prev.map(r => {
          if (r.id !== selectedRepoId) return r;

          const updatedComments = (r.reviewComments || [])
            .map(lc => {
              if (
                lc.repoId === selectedRepoId &&
                lc.branchName === selectedBranchName &&
                lc.filePath === filePath &&
                lc.lineNumber === lineNumber
              ) {
                const filteredComments = lc.comments.filter(
                  c => c.id !== commentId,
                );
                return filteredComments.length > 0
                  ? {...lc, comments: filteredComments}
                  : null;
              }
              return lc;
            })
            .filter((lc): lc is LineComments => lc !== null);

          return {...r, reviewComments: updatedComments};
        }),
      );
    },
    [selectedRepoId, selectedBranchName],
  );

  const toggleResolveLineComment = useCallback(
    (filePath: string, lineNumber: number) => {
      if (!selectedRepoId || !selectedBranchName) return;

      setRepos(prev =>
        prev.map(r => {
          if (r.id !== selectedRepoId) return r;

          const updatedComments = (r.reviewComments || []).map(lc => {
            if (
              lc.repoId === selectedRepoId &&
              lc.branchName === selectedBranchName &&
              lc.filePath === filePath &&
              lc.lineNumber === lineNumber
            ) {
              const currentlyResolved = lc.comments[0]?.isResolved;
              return {
                ...lc,
                comments: lc.comments.map(c => ({
                  ...c,
                  isResolved: !currentlyResolved,
                })),
              };
            }
            return lc;
          });

          return {...r, reviewComments: updatedComments};
        }),
      );
    },
    [selectedRepoId, selectedBranchName],
  );

  const onToggleRepo = useCallback((id: string) => {
    setCollapsed(prev => ({...prev, [id]: !prev[id]}));
  }, []);

  const onSelectRepo = useCallback((id: string) => {
    setSelectedRepoId(id);
  }, []);

  const onSelectPr = useCallback((id: string, prId: string) => {
    setSelectedRepoId(id);
    setSelectedPrId(prId);
    setSelectedBranchName(undefined);
  }, []);

  const onSelectBranch = useCallback(
    async (id: string, br: string) => {
      setSelectedRepoId(id);
      setSelectedBranchName(br);
      setSelectedPrId(undefined);

      // Lazy load branch data if not already loaded
      const repo = repos.find(r => r.id === id);
      if (
        repo &&
        !repo.branchCommits?.[br] &&
        repo.path &&
        repo.baseBranch
      ) {
        setIsLoading(true);
        setLoadingMessage(`Loading branch: ${br}`);
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
          setIsLoading(false);
          setLoadingMessage('');
        }
      }
    },
    [repos],
  );

  const colors = getColors(isDarkMode);

  useEffect(() => {
    const persisted = loadState();
    if (persisted) {
      // Migration: previous builds bundled a stale main.jsbundle that seeded demo repos.
      // If repos look like demo data (ids like r1/r2 and no local path set), drop them.
      const incoming = Array.isArray(persisted.repos) ? persisted.repos : [];
      const looksLikeDemo =
        incoming.length > 0 &&
        incoming.every(
          (r: any) =>
            !r.path && typeof r.id === 'string' && /^r\d+$/.test(r.id),
        );
      const cleaned = looksLikeDemo ? [] : incoming;

      setRepos(cleaned);
      setSelectedRepoId(looksLikeDemo ? undefined : persisted.selectedRepoId);
      setSelectedPrId(looksLikeDemo ? undefined : persisted.selectedPrId);
      setSelectedBranchName(
        looksLikeDemo ? undefined : persisted.selectedBranchName,
      );
      setCollapsed(persisted.collapsed ?? {});

      // If we cleaned demo data, persist the cleanup immediately to avoid it coming back.
      if (looksLikeDemo) {
        saveState({
          repos: [],
          selectedRepoId: undefined,
          selectedPrId: undefined,
          selectedBranchName: undefined,
          collapsed: persisted.collapsed ?? {},
        });
      }
    }
  }, []);

  useEffect(() => {
    saveState({
      repos,
      selectedRepoId,
      selectedPrId,
      selectedBranchName,
      collapsed,
    });
  }, [repos, selectedRepoId, selectedPrId, selectedBranchName, collapsed]);

  const addLocalRepo = async () => {
    try {
      setLoadingMessage('Select a repository folder...');
      const path = await pickFolder();

      if (!path) {
        setLoadingMessage('');
        return; // User cancelled
      }

      setIsLoading(true);
      const nameSegs = path.split(/[\\/]/).filter(Boolean);
      const name = nameSegs[nameSegs.length - 1] || path;

      setLoadingMessage(`Step 1/6: Validating git repository...`);
      await new Promise<void>(resolve => setTimeout(() => resolve(), 50));

      const scan = await scanRepo(path, (step: string) => {
        setLoadingMessage(step);
      });

      if (
        !scan ||
        !Array.isArray(scan.branches) ||
        scan.branches.length === 0
      ) {
        setIsLoading(false);
        setLoadingMessage('');
        Alert.alert(
          'Invalid Repository',
          'The selected folder is not a valid Git repository or has no branches.',
        );
        return;
      }

      setLoadingMessage(`Finalizing...`);
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
      setSelectedPrId(undefined);
      setSelectedBranchName(scan.currentBranch);
      setCollapsed(prev => ({ ...prev, [newRepo.id]: false }));

      setLoadingMessage('Done!');
      await new Promise<void>(resolve => setTimeout(() => resolve(), 300));

      setIsLoading(false);
      setLoadingMessage('');
    } catch (e) {
      setIsLoading(false);
      setLoadingMessage('');
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
          selectedPrId={selectedPrId}
          selectedBranchName={selectedBranchName}
          collapsed={collapsed}
          onToggleRepo={onToggleRepo}
          onSelectRepo={onSelectRepo}
          onSelectPr={onSelectPr}
          onSelectBranch={onSelectBranch}
          onAddRepo={addLocalRepo}
        />
      </ErrorBoundary>
      <ErrorBoundary componentName="BranchDetails">
        <View style={styles.main}>
        {selectedPr ? (
          <PRDetails pr={selectedPr} onAddComment={addComment} />
        ) : (
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
        )}
        </View>
      </ErrorBoundary>
    </View>
  );
}

function getColors(isDark: boolean) {
  return {
    windowBg: isDark ? '#1e1e1e' : '#f5f5f5',
  };
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
