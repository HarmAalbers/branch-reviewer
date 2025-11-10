import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  useColorScheme,
} from 'react-native';
import type { PullRequest } from '../types';

export type PRDetailsProps = {
  pr?: PullRequest;
  onAddComment?: (body: string) => void;
};

export function PRDetails({ pr, onAddComment }: PRDetailsProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = getColors(isDark);
  const [comment, setComment] = useState('');

  // Hooks must be called unconditionally in the same order on every render.
  // Compute a memoized summary even when pr is undefined, guarding accordingly.
  const fileSummary = useMemo(() => {
    if (!pr) return { adds: 0, dels: 0, files: 0 };
    const adds = pr.files.reduce((acc, f) => acc + f.additions, 0);
    const dels = pr.files.reduce((acc, f) => acc + f.deletions, 0);
    return { adds, dels, files: pr.files.length };
  }, [pr]);

  if (!pr) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.muted }}>
          Select a pull request from the left.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.fg }]}>{pr.title}</Text>
        <Text style={{ color: colors.muted }}>by {pr.author}</Text>
      </View>
      {pr.description ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>
            Description
          </Text>
          <Text style={{ color: colors.fg }}>{pr.description}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.fg }]}>
          Files changed ({fileSummary.files}) · +{fileSummary.adds} −
          {fileSummary.dels}
        </Text>
        <ScrollView
          style={[
            styles.diffBox,
            { backgroundColor: colors.codeBg, borderColor: colors.border },
          ]}
          contentContainerStyle={{ padding: 12 }}
        >
          {pr.files.map(f => (
            <View key={f.path} style={{ marginBottom: 16 }}>
              <Text style={[styles.filePath, { color: colors.muted }]}>
                {f.path} (+{f.additions} −{f.deletions})
              </Text>
              {f.patch.map((line, i) => (
                <Text
                  key={i}
                  style={[
                    styles.codeLine,
                    {
                      color: getLineColor(line, colors),
                      fontFamily: monospaceFont,
                    },
                  ]}
                >
                  {line}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.fg }]}>
          Comments ({pr.comments.length})
        </Text>
        <View style={[styles.commentList, { borderColor: colors.border }]}>
          {pr.comments.length === 0 ? (
            <Text style={{ color: colors.muted }}>No comments yet.</Text>
          ) : (
            pr.comments.map(c => (
              <View key={c.id} style={styles.commentItem}>
                <Text style={[styles.commentMeta, { color: colors.muted }]}>
                  {c.author} · {new Date(c.createdAt).toLocaleString()}
                </Text>
                <Text style={{ color: colors.fg }}>{c.body}</Text>
              </View>
            ))
          )}
        </View>

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment"
          placeholderTextColor={colors.placeholder}
          multiline
          style={[
            styles.input,
            {
              color: colors.fg,
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              fontFamily: monospaceFont,
            },
          ]}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => {
              setComment('');
            }}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed
                  ? colors.buttonPressed
                  : colors.buttonBg,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: colors.fg }}>Clear</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (comment.trim()) {
                onAddComment?.(comment.trim());
                setComment('');
              }
            }}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed
                  ? colors.buttonPrimaryPressed
                  : colors.buttonPrimary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Comment</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const monospaceFont = 'Menlo, monospace';

function getLineColor(line: string, c: ReturnType<typeof getColors>) {
  if (line.startsWith('+')) return c.add;
  if (line.startsWith('-')) return c.del;
  return c.code;
}

function getColors(isDark: boolean) {
  return {
    bg: isDark ? '#0b0f14' : '#ffffff',
    fg: isDark ? '#c9d1d9' : '#24292f',
    muted: isDark ? '#8b949e' : '#57606a',
    border: isDark ? '#30363d' : '#d0d7de',
    codeBg: isDark ? '#161b22' : '#f6f8fa',
    code: isDark ? '#c9d1d9' : '#24292f',
    add: '#3fb950',
    del: '#f85149',
    inputBg: isDark ? '#0d1117' : '#ffffff',
    placeholder: isDark ? '#8b949e' : '#6e7781',
    buttonBg: isDark ? '#161b22' : '#f6f8fa',
    buttonPressed: isDark ? '#0d1117' : '#eaeef2',
    buttonPrimary: '#2da44e',
    buttonPrimaryPressed: '#2c974b',
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  section: { marginTop: 12, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  diffBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    maxHeight: 260,
  },
  filePath: { fontSize: 12, marginBottom: 4 },
  codeLine: { fontSize: 12, lineHeight: 18 },
  commentList: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    padding: 12,
    gap: 12,
  },
  commentItem: { gap: 4 },
  commentMeta: { fontSize: 12 },
  input: {
    minHeight: 60,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default PRDetails;
