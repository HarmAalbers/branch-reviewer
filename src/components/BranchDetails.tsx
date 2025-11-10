import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import type { FileChange, Commit } from '../types';

export type BranchDetailsProps = {
  branchName?: string;
  baseBranch?: string;
  commits?: Commit[];
  files?: FileChange[];
};

export function BranchDetails({
  branchName,
  baseBranch,
  commits,
  files,
}: BranchDetailsProps) {
  const isDark = useColorScheme() === 'dark';
  const c = getColors(isDark);

  if (!branchName) {
    return (
      <View style={[styles.empty, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.muted }}>Select a branch or pull request.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[styles.title, { color: c.fg }]}>
        {branchName}
        {baseBranch ? (
          <Text style={{ color: c.muted }}> · since {baseBranch}</Text>
        ) : null}
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.fg }]}>
          Commits ({commits?.length ?? 0})
        </Text>
        <ScrollView
          style={[styles.box, { borderColor: c.border }]}
          contentContainerStyle={{ padding: 8 }}
        >
          {(commits ?? []).map(cm => (
            <View key={cm.hash} style={{ marginBottom: 8 }}>
              <Text style={{ color: c.fg, fontWeight: '600' }}>
                {cm.message}
              </Text>
              <Text style={{ color: c.muted, fontSize: 12 }}>
                {cm.author} · {new Date(cm.dateISO).toLocaleString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.fg }]}>
          Files changed ({files?.length ?? 0})
        </Text>
        <ScrollView
          style={[styles.box, { borderColor: c.border }]}
          contentContainerStyle={{ padding: 8 }}
        >
          {(files ?? []).map(f => (
            <View key={f.path} style={{ marginBottom: 12 }}>
              <Text style={{ color: c.muted }}>
                {f.path} (+{f.additions} −{f.deletions})
              </Text>
              {f.patch.map((line, i) => (
                <Text
                  key={i}
                  style={{
                    color: getLineColor(line, c),
                    fontFamily: monospaceFont,
                    fontSize: 12,
                  }}
                >
                  {line}
                </Text>
              ))}
            </View>
          ))}
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
    bg: isDark ? '#0b0f14' : '#ffffff',
    fg: isDark ? '#c9d1d9' : '#24292f',
    muted: isDark ? '#8b949e' : '#57606a',
    border: isDark ? '#30363d' : '#d0d7de',
    code: isDark ? '#c9d1d9' : '#24292f',
    add: '#3fb950',
    del: '#f85149',
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  box: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    maxHeight: 260,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default BranchDetails;
