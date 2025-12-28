import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import type { ReviewComment } from '../types';

export type CommentThreadProps = {
  comments: ReviewComment[];
  onAddComment: (body: string, parentId?: string) => void;
  onEditComment: (id: string, body: string) => void;
  onDeleteComment: (id: string) => void;
  onToggleResolve: () => void;
  isResolved?: boolean;
};

export function CommentThread({
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onToggleResolve,
  isResolved,
}: CommentThreadProps) {
  const isDark = useColorScheme() === 'dark';
  const c = getColors(isDark);

  const [isAddingComment, setIsAddingComment] = useState(comments.length === 0);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const handleSaveNew = () => {
    if (newCommentBody.trim()) {
      onAddComment(newCommentBody.trim(), replyToId || undefined);
      setNewCommentBody('');
      setIsAddingComment(false);
      setReplyToId(null);
    }
  };

  const handleSaveEdit = (id: string) => {
    if (editBody.trim()) {
      onEditComment(id, editBody.trim());
      setEditingId(null);
      setEditBody('');
    }
  };

  const handleStartEdit = (comment: ReviewComment) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const handleStartReply = (commentId: string) => {
    setReplyToId(commentId);
    setIsAddingComment(true);
  };

  // Organize comments into threads
  const topLevelComments = comments.filter(comment => !comment.parentId);
  const getReplies = (parentId: string) =>
    comments.filter(comment => comment.parentId === parentId);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.threadBg,
          borderColor: isResolved ? c.resolvedBorder : c.border,
        },
      ]}
    >
      {/* Resolved badge */}
      {isResolved && (
        <View
          style={[styles.resolvedBadge, { backgroundColor: c.resolvedBadgeBg }]}
        >
          <Text style={[styles.resolvedText, { color: c.resolvedText }]}>
            ✓ Resolved
          </Text>
        </View>
      )}

      {/* Existing comments */}
      {topLevelComments.map(comment => (
        <View key={comment.id}>
          <CommentItem
            comment={comment}
            isEditing={editingId === comment.id}
            editBody={editBody}
            onEdit={setEditBody}
            onSaveEdit={() => handleSaveEdit(comment.id)}
            onCancelEdit={() => {
              setEditingId(null);
              setEditBody('');
            }}
            onStartEdit={() => handleStartEdit(comment)}
            onDelete={() => onDeleteComment(comment.id)}
            onReply={() => handleStartReply(comment.id)}
            colors={c}
          />

          {/* Replies */}
          {getReplies(comment.id).map(reply => (
            <View key={reply.id} style={styles.replyIndent}>
              <CommentItem
                comment={reply}
                isEditing={editingId === reply.id}
                editBody={editBody}
                onEdit={setEditBody}
                onSaveEdit={() => handleSaveEdit(reply.id)}
                onCancelEdit={() => {
                  setEditingId(null);
                  setEditBody('');
                }}
                onStartEdit={() => handleStartEdit(reply)}
                onDelete={() => onDeleteComment(reply.id)}
                onReply={() => handleStartReply(reply.id)}
                colors={c}
                isReply
              />
            </View>
          ))}
        </View>
      ))}

      {/* Add new comment / reply */}
      {isAddingComment ? (
        <View style={styles.inputContainer}>
          {replyToId && (
            <Text style={[styles.replyingTo, { color: c.muted }]}>
              Replying to comment...
            </Text>
          )}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: c.inputBg,
                color: c.fg,
                borderColor: c.border,
              },
            ]}
            value={newCommentBody}
            onChangeText={setNewCommentBody}
            placeholder="Add a comment..."
            placeholderTextColor={c.muted}
            multiline
            autoFocus
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => {
                setIsAddingComment(false);
                setNewCommentBody('');
                setReplyToId(null);
              }}
              style={[styles.button, { backgroundColor: c.buttonSecondary }]}
            >
              <Text style={{ color: c.fg, fontSize: 12 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveNew}
              style={[styles.button, { backgroundColor: c.buttonPrimary }]}
              disabled={!newCommentBody.trim()}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                {replyToId ? 'Reply' : 'Comment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => setIsAddingComment(true)}
            style={[styles.linkButton]}
          >
            <Text style={{ color: c.link, fontSize: 12 }}>Add comment</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleResolve} style={styles.linkButton}>
            <Text style={{ color: c.link, fontSize: 12 }}>
              {isResolved ? 'Unresolve' : 'Resolve'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

type CommentItemProps = {
  comment: ReviewComment;
  isEditing: boolean;
  editBody: string;
  onEdit: (body: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onReply: () => void;
  colors: ReturnType<typeof getColors>;
  isReply?: boolean;
};

function CommentItem({
  comment,
  isEditing,
  editBody,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
  onReply,
  colors: c,
  isReply,
}: CommentItemProps) {
  return (
    <View
      style={[
        styles.commentItem,
        { borderBottomColor: c.border },
        isReply && styles.replyItem,
      ]}
    >
      {isEditing ? (
        <View>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: c.inputBg,
                color: c.fg,
                borderColor: c.border,
              },
            ]}
            value={editBody}
            onChangeText={onEdit}
            multiline
            autoFocus
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onCancelEdit}
              style={[styles.button, { backgroundColor: c.buttonSecondary }]}
            >
              <Text style={{ color: c.fg, fontSize: 12 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSaveEdit}
              style={[styles.button, { backgroundColor: c.buttonPrimary }]}
              disabled={!editBody.trim()}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View>
          <Text style={[styles.commentBody, { color: c.fg }]}>
            {comment.body}
          </Text>
          <Text style={[styles.commentMeta, { color: c.muted }]}>
            {new Date(comment.createdAt).toLocaleString()}
            {comment.updatedAt && ' (edited)'}
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onStartEdit} style={styles.linkButton}>
              <Text style={{ color: c.link, fontSize: 11 }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.linkButton}>
              <Text style={{ color: c.danger, fontSize: 11 }}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onReply} style={styles.linkButton}>
              <Text style={{ color: c.link, fontSize: 11 }}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function getColors(isDark: boolean) {
  return {
    threadBg: isDark ? '#2d2d30' : '#f6f8fa',
    bg: isDark ? '#1e1e1e' : '#ffffff',
    fg: isDark ? '#cccccc' : '#24292f',
    muted: isDark ? '#858585' : '#57606a',
    border: isDark ? '#3e3e3e' : '#d0d7de',
    resolvedBorder: isDark ? '#2ea043' : '#1a7f37',
    resolvedBadgeBg: isDark ? '#2ea04333' : '#dafbe1',
    resolvedText: isDark ? '#3fb950' : '#1a7f37',
    inputBg: isDark ? '#1e1e1e' : '#ffffff',
    buttonPrimary: isDark ? '#238636' : '#2da44e',
    buttonSecondary: isDark ? '#3e3e3e' : '#f6f8fa',
    link: isDark ? '#58a6ff' : '#0969da',
    danger: isDark ? '#f85149' : '#cf222e',
  };
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginVertical: 8,
    gap: 8,
  },
  resolvedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  resolvedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  commentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  replyItem: {
    borderBottomWidth: 0,
  },
  replyIndent: {
    marginLeft: 20,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#3e3e3e', // Note: Should be dynamically set via inline style with c.border
  },
  commentBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  commentMeta: {
    fontSize: 11,
    marginBottom: 6,
  },
  inputContainer: {
    gap: 8,
  },
  replyingTo: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  linkButton: {
    paddingVertical: 2,
  },
});

export default React.memo(CommentThread);
