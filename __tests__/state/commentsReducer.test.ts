/**
 * @format
 */

import {
  commentsReducer,
  type CommentAction,
} from '../../src/state/commentsReducer';
import type { Repo } from '../../src/types';

describe('commentsReducer', () => {
  const mockRepo: Repo = {
    id: 'repo-1',
    name: 'test-repo',
    path: '/path',
    branches: [{ name: 'main', isCurrent: true }],
    pullRequests: [],
    baseBranch: 'main',
    branchCommits: {},
    branchFiles: {},
    reviewComments: [],
  };

  describe('ADD_COMMENT', () => {
    it('adds comment to PR', () => {
      const repoWithPR: Repo = {
        ...mockRepo,
        pullRequests: [
          {
            id: 'pr-1',
            title: 'Test PR',
            author: 'test',
            files: [],
            comments: [],
          },
        ],
      };

      const action: CommentAction = {
        type: 'ADD_COMMENT',
        payload: { repoId: 'repo-1', prId: 'pr-1', body: 'Great work!' },
      };

      const result = commentsReducer([repoWithPR], action);

      expect(result[0].pullRequests[0].comments).toHaveLength(1);
      expect(result[0].pullRequests[0].comments[0].body).toBe('Great work!');
      expect(result[0].pullRequests[0].comments[0].author).toBe('you');
    });
  });

  describe('ADD_LINE_COMMENT', () => {
    it('creates new LineComments entry for first comment on line', () => {
      const action: CommentAction = {
        type: 'ADD_LINE_COMMENT',
        payload: {
          repoId: 'repo-1',
          branchName: 'main',
          filePath: 'test.ts',
          lineNumber: 10,
          body: 'Fix this',
        },
      };

      const result = commentsReducer([mockRepo], action);

      expect(result[0].reviewComments).toHaveLength(1);
      expect(result[0].reviewComments![0].filePath).toBe('test.ts');
      expect(result[0].reviewComments![0].lineNumber).toBe(10);
      expect(result[0].reviewComments![0].comments[0].body).toBe('Fix this');
    });

    it('appends to existing LineComments entry', () => {
      const repoWithComments: Repo = {
        ...mockRepo,
        reviewComments: [
          {
            repoId: 'repo-1',
            branchName: 'main',
            filePath: 'test.ts',
            lineNumber: 10,
            comments: [
              {
                id: 'c1',
                body: 'First comment',
                createdAt: '2025-12-28T10:00:00Z',
              },
            ],
          },
        ],
      };

      const action: CommentAction = {
        type: 'ADD_LINE_COMMENT',
        payload: {
          repoId: 'repo-1',
          branchName: 'main',
          filePath: 'test.ts',
          lineNumber: 10,
          body: 'Second comment',
        },
      };

      const result = commentsReducer([repoWithComments], action);

      expect(result[0].reviewComments).toHaveLength(1);
      expect(result[0].reviewComments![0].comments).toHaveLength(2);
      expect(result[0].reviewComments![0].comments[1].body).toBe(
        'Second comment',
      );
    });

    it('adds comment with parentId for threaded replies', () => {
      const action: CommentAction = {
        type: 'ADD_LINE_COMMENT',
        payload: {
          repoId: 'repo-1',
          branchName: 'main',
          filePath: 'test.ts',
          lineNumber: 10,
          body: 'Reply',
          parentId: 'parent-123',
        },
      };

      const result = commentsReducer([mockRepo], action);

      expect(result[0].reviewComments![0].comments[0].parentId).toBe(
        'parent-123',
      );
    });
  });

  describe('EDIT_LINE_COMMENT', () => {
    it('updates comment body and sets updatedAt', () => {
      const repoWithComments: Repo = {
        ...mockRepo,
        reviewComments: [
          {
            repoId: 'repo-1',
            branchName: 'main',
            filePath: 'test.ts',
            lineNumber: 10,
            comments: [
              { id: 'c1', body: 'Old text', createdAt: '2025-12-28T10:00:00Z' },
            ],
          },
        ],
      };

      const action: CommentAction = {
        type: 'EDIT_LINE_COMMENT',
        payload: {
          repoId: 'repo-1',
          branchName: 'main',
          filePath: 'test.ts',
          lineNumber: 10,
          commentId: 'c1',
          body: 'Updated text',
        },
      };

      const result = commentsReducer([repoWithComments], action);

      expect(result[0].reviewComments![0].comments[0].body).toBe(
        'Updated text',
      );
      expect(result[0].reviewComments![0].comments[0].updatedAt).toBeDefined();
    });
  });

  describe('DELETE_LINE_COMMENT', () => {
    it('removes comment and keeps LineComments entry when other comments exist', () => {
      const repoWithComments: Repo = {
        ...mockRepo,
        reviewComments: [
          {
            repoId: 'repo-1',
            branchName: 'main',
            filePath: 'test.ts',
            lineNumber: 10,
            comments: [
              { id: 'c1', body: 'First', createdAt: '2025-12-28T10:00:00Z' },
              { id: 'c2', body: 'Second', createdAt: '2025-12-28T10:01:00Z' },
            ],
          },
        ],
      };

      const action: CommentAction = {
        type: 'DELETE_LINE_COMMENT',
        payload: {
          repoId: 'repo-1',
          branchName: 'main',
          filePath: 'test.ts',
          lineNumber: 10,
          commentId: 'c1',
        },
      };

      const result = commentsReducer([repoWithComments], action);

      expect(result[0].reviewComments).toHaveLength(1);
      expect(result[0].reviewComments![0].comments).toHaveLength(1);
      expect(result[0].reviewComments![0].comments[0].id).toBe('c2');
    });

    it('removes entire LineComments entry when deleting last comment', () => {
      const repoWithComments: Repo = {
        ...mockRepo,
        reviewComments: [
          {
            repoId: 'repo-1',
            branchName: 'main',
            filePath: 'test.ts',
            lineNumber: 10,
            comments: [
              {
                id: 'c1',
                body: 'Only comment',
                createdAt: '2025-12-28T10:00:00Z',
              },
            ],
          },
        ],
      };

      const action: CommentAction = {
        type: 'DELETE_LINE_COMMENT',
        payload: {
          repoId: 'repo-1',
          branchName: 'main',
          filePath: 'test.ts',
          lineNumber: 10,
          commentId: 'c1',
        },
      };

      const result = commentsReducer([repoWithComments], action);

      expect(result[0].reviewComments).toHaveLength(0);
    });
  });

  describe('TOGGLE_RESOLVE_LINE_COMMENT', () => {
    it('toggles all comments to resolved', () => {
      const repoWithComments: Repo = {
        ...mockRepo,
        reviewComments: [
          {
            repoId: 'repo-1',
            branchName: 'main',
            filePath: 'test.ts',
            lineNumber: 10,
            comments: [
              {
                id: 'c1',
                body: 'Comment 1',
                createdAt: '2025-12-28T10:00:00Z',
              },
              {
                id: 'c2',
                body: 'Comment 2',
                createdAt: '2025-12-28T10:01:00Z',
              },
            ],
          },
        ],
      };

      const action: CommentAction = {
        type: 'TOGGLE_RESOLVE_LINE_COMMENT',
        payload: {
          repoId: 'repo-1',
          branchName: 'main',
          filePath: 'test.ts',
          lineNumber: 10,
        },
      };

      const result = commentsReducer([repoWithComments], action);

      expect(result[0].reviewComments![0].comments[0].isResolved).toBe(true);
      expect(result[0].reviewComments![0].comments[1].isResolved).toBe(true);
    });

    it('toggles from resolved to unresolved', () => {
      const repoWithComments: Repo = {
        ...mockRepo,
        reviewComments: [
          {
            repoId: 'repo-1',
            branchName: 'main',
            filePath: 'test.ts',
            lineNumber: 10,
            comments: [
              {
                id: 'c1',
                body: 'Comment',
                createdAt: '2025-12-28T10:00:00Z',
                isResolved: true,
              },
            ],
          },
        ],
      };

      const action: CommentAction = {
        type: 'TOGGLE_RESOLVE_LINE_COMMENT',
        payload: {
          repoId: 'repo-1',
          branchName: 'main',
          filePath: 'test.ts',
          lineNumber: 10,
        },
      };

      const result = commentsReducer([repoWithComments], action);

      expect(result[0].reviewComments![0].comments[0].isResolved).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('does not modify repos when action targets non-existent repo', () => {
      const action: CommentAction = {
        type: 'ADD_LINE_COMMENT',
        payload: {
          repoId: 'non-existent',
          branchName: 'main',
          filePath: 'test.ts',
          lineNumber: 10,
          body: 'Comment',
        },
      };

      const result = commentsReducer([mockRepo], action);

      expect(result).toEqual([mockRepo]);
    });

    it('returns repos unchanged for unknown action type', () => {
      const action = { type: 'UNKNOWN_ACTION', payload: {} } as any;

      const result = commentsReducer([mockRepo], action);

      expect(result).toEqual([mockRepo]);
    });
  });
});
