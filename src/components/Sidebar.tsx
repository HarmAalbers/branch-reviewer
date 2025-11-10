import React from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import type { Repo } from '../types';

export type SidebarProps = {
  repos: Repo[];
  selectedRepoId?: string;
  selectedPrId?: string;
  selectedBranchName?: string;
  collapsed: Record<string, boolean>;
  onToggleRepo: (repoId: string) => void;
  onSelectRepo: (repoId: string) => void;
  onSelectPr: (repoId: string, prId: string) => void;
  onSelectBranch: (repoId: string, branchName: string) => void;
};

export function Sidebar({
  repos,
  selectedRepoId,
  selectedPrId,
  selectedBranchName,
  collapsed,
  onToggleRepo,
  onSelectRepo,
  onSelectPr,
  onSelectBranch,
}: SidebarProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = getColors(isDark);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderRightColor: colors.border },
      ]}
    >
      <ScrollView>
        {repos.map(repo => {
          const isCollapsed = !!collapsed[repo.id];
          return (
            <View key={repo.id}>
              <Pressable
                onPress={() => {
                  onSelectRepo(repo.id);
                  onToggleRepo(repo.id);
                }}
                style={({ pressed }) => [
                  styles.repoHeader,
                  {
                    backgroundColor: pressed
                      ? colors.rowPressed
                      : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.repoChev, { color: colors.muted }]}>
                  {isCollapsed ? '▸' : '▾'}
                </Text>
                <Text style={[styles.repoName, { color: colors.muted }]}>
                  {repo.name}
                </Text>
              </Pressable>

              {!isCollapsed ? (
                <>
                  {/* Branches list */}
                  {repo.branches && repo.branches.length > 0 ? (
                    <View style={styles.section}>
                      <Text
                        style={[styles.sectionTitle, { color: colors.muted }]}
                      >
                        Branches
                      </Text>
                      {repo.branches.map(br => {
                        const selected =
                          repo.id === selectedRepoId &&
                          selectedBranchName === br.name;
                        const isCurrent = br.isCurrent === true;
                        return (
                          <Pressable
                            key={br.name}
                            onPress={() => {
                              onSelectRepo(repo.id);
                              onSelectBranch(repo.id, br.name);
                            }}
                            style={({ pressed }) => [
                              styles.branchRow,
                              {
                                backgroundColor: selected
                                  ? colors.selected
                                  : pressed
                                  ? colors.rowPressed
                                  : 'transparent',
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.branchDot,
                                {
                                  backgroundColor: isCurrent
                                    ? '#0969da'
                                    : '#8b949e',
                                },
                              ]}
                            />
                            <Text
                              numberOfLines={1}
                              style={[styles.branchName, { color: colors.fg }]}
                            >
                              {br.name}
                            </Text>
                            {isCurrent ? (
                              <Text
                                style={[
                                  styles.currentBadge,
                                  { color: colors.muted },
                                ]}
                              >
                                current
                              </Text>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}

                  {/* Pull requests list */}
                  {repo.pullRequests.map(pr => {
                    const selected =
                      repo.id === selectedRepoId && pr.id === selectedPrId;
                    return (
                      <Pressable
                        key={pr.id}
                        onPress={() => {
                          onSelectRepo(repo.id);
                          onSelectPr(repo.id, pr.id);
                        }}
                        style={({ pressed }) => [
                          styles.prRow,
                          {
                            backgroundColor: selected
                              ? colors.selected
                              : pressed
                              ? colors.rowPressed
                              : 'transparent',
                          },
                        ]}
                      >
                        <View style={styles.prDot} />
                        <Text
                          numberOfLines={1}
                          style={[styles.prTitle, { color: colors.fg }]}
                        >
                          {pr.title}
                        </Text>
                        <Text
                          style={[styles.prAuthor, { color: colors.muted }]}
                        >
                          {' '}
                          · {pr.author}
                        </Text>
                      </Pressable>
                    );
                  })}
                </>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function getColors(isDark: boolean) {
  return {
    bg: isDark ? '#0d1117' : '#f6f8fa',
    fg: isDark ? '#c9d1d9' : '#24292f',
    muted: isDark ? '#8b949e' : '#57606a',
    border: isDark ? '#30363d' : '#d0d7de',
    selected: isDark ? 'rgba(56,139,253,0.24)' : '#ddf4ff',
    rowPressed: isDark ? 'rgba(110,118,129,0.1)' : 'rgba(27,31,36,0.06)',
  };
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  repoHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repoChev: {
    width: 12,
    textAlign: 'center',
  },
  repoName: {
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
    marginTop: 2,
    marginBottom: 4,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  branchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  branchName: {
    flexShrink: 1,
    fontSize: 13,
  },
  currentBadge: {
    marginLeft: 6,
    fontSize: 11,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  prDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3fb950',
  },
  prTitle: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  prAuthor: {
    fontSize: 12,
  },
});

export default Sidebar;
