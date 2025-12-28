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
  onAddRepo: () => void;
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
  onAddRepo,
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Repositories
        </Text>
        <Pressable
          onPress={onAddRepo}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: pressed ? colors.rowPressed : colors.selected,
            },
          ]}
        >
          <Text style={{ color: colors.fg, fontSize: 18, fontWeight: '600' }}>
            +
          </Text>
        </Pressable>
      </View>
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
                                    ? colors.currentDot
                                    : colors.muted,
                                },
                              ]}
                            />
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.branchName,
                                {
                                  color: colors.fg,
                                  fontWeight: selected ? '600' : '400',
                                },
                              ]}
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
                                CURRENT
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
    bg: isDark ? '#252526' : '#f3f3f3',
    fg: isDark ? '#cccccc' : '#333333',
    muted: isDark ? '#858585' : '#6c6c6c',
    border: isDark ? '#3e3e3e' : '#e5e5e5',
    selected: isDark ? '#37373d' : '#e8e8e8',
    rowPressed: isDark ? '#2a2d2e' : '#e0e0e0',
    currentDot: isDark ? '#4fc1ff' : '#007acc',
  };
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    borderRightWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repoHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repoChev: {
    width: 12,
    textAlign: 'center',
    fontSize: 11,
  },
  repoName: {
    fontWeight: '600',
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginLeft: 4,
    marginTop: 8,
    marginBottom: 6,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    gap: 10,
    borderRadius: 6,
    marginHorizontal: 8,
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
    fontSize: 10,
    fontWeight: '600',
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    borderRadius: 6,
    marginHorizontal: 8,
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
    fontSize: 11,
  },
});

export default React.memo(Sidebar);
