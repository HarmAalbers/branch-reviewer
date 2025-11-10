import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import Sidebar from './src/components/Sidebar';
import PRDetails from './src/components/PRDetails';
import BranchDetails from './src/components/BranchDetails';
import type { Repo, PullRequest } from './src/types';
import { loadState, saveState } from './src/storage';
import { scanRepo } from './src/gitLocal';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // On macOS, StatusBar and SafeAreaProvider are not supported the same way as iOS/Android.
  // Avoid importing react-native-safe-area-context on macOS to prevent native module errors.
  let Wrapper: React.ComponentType<any> = React.Fragment;
  if (Platform.OS !== 'macos') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SafeAreaProvider } = require('react-native-safe-area-context');
    Wrapper = SafeAreaProvider;
  }

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

  // UI to open a local repo by entering a path
  const [openVisible, setOpenVisible] = useState(false);
  const [repoPathInput, setRepoPathInput] = useState('');
  const [addRepoError, setAddRepoError] = useState<string | undefined>(
    undefined,
  );

  const selectedRepo = useMemo(
    () => repos.find(r => r.id === selectedRepoId),
    [repos, selectedRepoId],
  );
  const selectedPr: PullRequest | undefined = useMemo(() => {
    const repo = selectedRepo;
    return repo?.pullRequests.find(p => p.id === selectedPrId);
  }, [selectedRepo, selectedPrId]);

  const addComment = (body: string) => {
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
            return { ...p, comments: [...p.comments, newComment] };
          }),
        };
      }),
    );
  };

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
    const path = repoPathInput.trim();
    if (!path) return;

    setAddRepoError(undefined);
    const nameSegs = path.split(/[\\/]/).filter(Boolean);
    const name = nameSegs[nameSegs.length - 1] || path;

    try {
      const scan = await scanRepo(path);
      if (
        !scan ||
        !Array.isArray(scan.branches) ||
        scan.branches.length === 0
      ) {
        setAddRepoError('Not a valid git repository or no branches found.');
        return;
      }

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
      // Auto-select the current branch and expand the repo
      setSelectedBranchName(scan.currentBranch);
      setCollapsed(prev => ({ ...prev, [newRepo.id]: false }));

      setRepoPathInput('');
      setAddRepoError(undefined);
      setOpenVisible(false);
    } catch (e) {
      const errorMsg =
        e instanceof Error
          ? e.message
          : 'Failed to add repository. Please check the path and try again.';
      setAddRepoError(errorMsg);
    }
  };

  return (
    <Wrapper>
      <View style={[styles.root, { backgroundColor: colors.windowBg }]}>
        <Sidebar
          repos={repos}
          selectedRepoId={selectedRepoId}
          selectedPrId={selectedPrId}
          selectedBranchName={selectedBranchName}
          collapsed={collapsed}
          onToggleRepo={id =>
            setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))
          }
          onSelectRepo={id => {
            setSelectedRepoId(id);
          }}
          onSelectPr={(id, prId) => {
            setSelectedRepoId(id);
            setSelectedPrId(prId);
            setSelectedBranchName(undefined);
          }}
          onSelectBranch={(id, br) => {
            setSelectedRepoId(id);
            setSelectedBranchName(br);
            setSelectedPrId(undefined);
          }}
        />
        <View style={styles.main}>
          <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
            <Text
              style={{
                color: colors.title,
                fontWeight: '600',
                marginRight: 12,
              }}
            >
              Branch Reviewer
            </Text>
            <Pressable
              onPress={() => setOpenVisible(v => !v)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  backgroundColor: pressed ? '#eaeef2' : '#f6f8fa',
                },
              ]}
            >
              <Text style={{ color: '#24292f' }}>Open Local Repo…</Text>
            </Pressable>
          </View>
          {openVisible ? (
            <View
              style={[styles.openRow, { borderBottomColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={repoPathInput}
                    onChangeText={text => {
                      setRepoPathInput(text);
                      setAddRepoError(undefined);
                    }}
                    placeholder="/path/to/repo"
                    placeholderTextColor={isDarkMode ? '#8b949e' : '#6e7781'}
                    style={[
                      styles.openInput,
                      {
                        color: isDarkMode ? '#c9d1d9' : '#24292f',
                        borderColor: addRepoError ? '#f85149' : colors.border,
                        backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
                      },
                    ]}
                  />
                  <Pressable
                    onPress={addLocalRepo}
                    style={({ pressed }) => [
                      styles.openAddBtn,
                      { backgroundColor: pressed ? '#2c974b' : '#2da44e' },
                    ]}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>
                      Add
                    </Text>
                  </Pressable>
                </View>
                {addRepoError ? (
                  <Text
                    style={{ color: '#f85149', fontSize: 12, marginTop: 4 }}
                  >
                    {addRepoError}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
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
            />
          )}
        </View>
      </View>
    </Wrapper>
  );
}

function getColors(isDark: boolean) {
  return {
    windowBg: isDark ? '#0d1117' : '#ffffff',
    title: isDark ? '#c9d1d9' : '#24292f',
    border: isDark ? '#30363d' : '#d0d7de',
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
  topBar: {
    height: 36,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  openRow: {
    padding: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  openInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  openAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
});

export default App;
