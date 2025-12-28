import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import type { FileChange, Commit, LineComments } from '../types';
import { CommentThread } from './CommentThread';

export type BranchDetailsProps = {
  branchName?: string;
  baseBranch?: string;
  commits?: Commit[];
  files?: FileChange[];
  repoId?: string;
  lineComments?: LineComments[];
  onAddComment?: (
    filePath: string,
    lineNumber: number,
    body: string,
    parentId?: string,
  ) => void;
  onEditComment?: (
    filePath: string,
    lineNumber: number,
    commentId: string,
    body: string,
  ) => void;
  onDeleteComment?: (
    filePath: string,
    lineNumber: number,
    commentId: string,
  ) => void;
  onToggleResolve?: (filePath: string, lineNumber: number) => void;
};

export function BranchDetails({
  branchName,
  baseBranch,
  commits,
  files,
  repoId,
  lineComments = [],
  onAddComment,
  onEditComment,
  onDeleteComment,
  onToggleResolve,
}: BranchDetailsProps) {
  const isDark = useColorScheme() === 'dark';
  const c = getColors(isDark);
  const [activeCommentLine, setActiveCommentLine] = useState<{
    filePath: string;
    lineNumber: number;
  } | null>(null);

  const getCommentsForLine = (filePath: string, lineNumber: number) => {
    return lineComments.find(
      lc =>
        lc.repoId === repoId &&
        lc.branchName === branchName &&
        lc.filePath === filePath &&
        lc.lineNumber === lineNumber,
    );
  };

  const handleLineClick = (filePath: string, lineNumber: number) => {
    if (
      activeCommentLine?.filePath === filePath &&
      activeCommentLine?.lineNumber === lineNumber
    ) {
      setActiveCommentLine(null);
    } else {
      setActiveCommentLine({ filePath, lineNumber });
    }
  };

  if (!branchName) {
    return (
      <View style={[styles.empty, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.muted, fontSize: 14 }}>
          Select a branch to view details
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View>
        <Text style={[styles.title, { color: c.fg }]}>{branchName}</Text>
        {baseBranch ? (
          <Text style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>
            Comparing to {baseBranch}
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.fg }]}>
          Commits ({commits?.length ?? 0})
        </Text>
        <ScrollView
          style={[
            styles.box,
            { borderColor: c.border, backgroundColor: c.contentBg },
          ]}
          contentContainerStyle={{ padding: 12 }}
        >
          {commits && commits.length > 0 ? (
            commits.map(cm => (
              <View
                key={cm.hash}
                style={{
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                <Text
                  style={{
                    color: c.fg,
                    fontWeight: '600',
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  {cm.message}
                </Text>
                <Text style={{ color: c.muted, fontSize: 12 }}>
                  {cm.author} · {new Date(cm.dateISO).toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: c.muted, fontSize: 13 }}>
              No commits in this branch
            </Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.fg }]}>
          Files changed ({files?.length ?? 0})
        </Text>
        <ScrollView
          style={[
            styles.box,
            { borderColor: c.border, backgroundColor: c.contentBg },
          ]}
          contentContainerStyle={{ padding: 12 }}
        >
          {files && files.length > 0 ? (
            files.map(f => (
              <View key={f.path} style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      color: c.fg,
                      fontSize: 13,
                      fontWeight: '600',
                      flex: 1,
                    }}
                  >
                    {f.path}
                  </Text>
                  <Text style={{ color: c.muted, fontSize: 11 }}>
                    +{f.additions} −{f.deletions}
                  </Text>
                </View>
                {f.patch.map((line, i) => {
                  const lineNumber = i + 1;
                  const lineCommentsData = getCommentsForLine(
                    f.path,
                    lineNumber,
                  );
                  const hasComments =
                    lineCommentsData && lineCommentsData.comments.length > 0;
                  const isActive =
                    activeCommentLine?.filePath === f.path &&
                    activeCommentLine?.lineNumber === lineNumber;
                  const showCommentThread = hasComments || isActive;

                  return (
                    <View key={i}>
                      <TouchableOpacity
                        onPress={() => handleLineClick(f.path, lineNumber)}
                        style={[
                          styles.diffLine,
                          hasComments && {
                            backgroundColor: c.commentIndicatorBg,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: getLineColor(line, c),
                            fontFamily: monospaceFont,
                            fontSize: 11,
                            lineHeight: 16,
                          }}
                        >
                          {line}
                        </Text>
                        {hasComments && (
                          <View style={styles.commentBadge}>
                            <Text
                              style={[
                                styles.commentBadgeText,
                                { color: c.link },
                              ]}
                            >
                              {lineCommentsData.comments.length}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      {showCommentThread && onAddComment && (
                        <CommentThread
                          comments={lineCommentsData?.comments || []}
                          onAddComment={(body, parentId) =>
                            onAddComment(f.path, lineNumber, body, parentId)
                          }
                          onEditComment={(id, body) =>
                            onEditComment?.(f.path, lineNumber, id, body)
                          }
                          onDeleteComment={id =>
                            onDeleteComment?.(f.path, lineNumber, id)
                          }
                          onToggleResolve={() =>
                            onToggleResolve?.(f.path, lineNumber)
                          }
                          isResolved={lineCommentsData?.comments[0]?.isResolved}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <Text style={{ color: c.muted, fontSize: 13 }}>
              No files changed in this branch
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function getLineColor(line: string, c: ReturnType<typeof getColors>) {
  if (line.startsWith('+')) return c.add;
  if (line.startsWith('-')) return c.del;
  return c.code;
}

const monospaceFont = 'Menlo, monospace';

function getColors(isDark: boolean) {
  return {
    bg: isDark ? '#1e1e1e' : '#ffffff',
    contentBg: isDark ? '#252526' : '#f8f8f8',
    fg: isDark ? '#cccccc' : '#333333',
    muted: isDark ? '#858585' : '#6c6c6c',
    border: isDark ? '#3e3e3e' : '#e5e5e5',
    code: isDark ? '#d4d4d4' : '#1e1e1e',
    add: isDark ? '#4ec9b0' : '#098658',
    del: isDark ? '#f48771' : '#a31515',
    commentIndicatorBg: isDark ? '#2d2d3050' : '#f6f8fa50',
    link: isDark ? '#58a6ff' : '#0969da',
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 20 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  box: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 320,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  diffLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    borderRadius: 3,
  },
  commentBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#3e3e3e',
  },
  commentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default BranchDetails;
