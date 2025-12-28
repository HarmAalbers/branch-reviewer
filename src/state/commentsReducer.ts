import type { Repo, ReviewComment, LineComments } from '../types';

// Action types for comment management
export type CommentAction =
  | {
      type: 'ADD_COMMENT';
      payload: { repoId: string; prId: string; body: string };
    }
  | {
      type: 'ADD_LINE_COMMENT';
      payload: {
        repoId: string;
        branchName: string;
        filePath: string;
        lineNumber: number;
        body: string;
        parentId?: string;
      };
    }
  | {
      type: 'EDIT_LINE_COMMENT';
      payload: {
        repoId: string;
        branchName: string;
        filePath: string;
        lineNumber: number;
        commentId: string;
        body: string;
      };
    }
  | {
      type: 'DELETE_LINE_COMMENT';
      payload: {
        repoId: string;
        branchName: string;
        filePath: string;
        lineNumber: number;
        commentId: string;
      };
    }
  | {
      type: 'TOGGLE_RESOLVE_LINE_COMMENT';
      payload: {
        repoId: string;
        branchName: string;
        filePath: string;
        lineNumber: number;
      };
    };

// Helper to find and update a specific repo
function updateRepo(
  repos: Repo[],
  repoId: string,
  updater: (repo: Repo) => Repo,
): Repo[] {
  return repos.map(r => (r.id === repoId ? updater(r) : r));
}

// Helper to find and update a specific line comment
function updateLineComment(
  lineComments: LineComments[],
  {
    repoId,
    branchName,
    filePath,
    lineNumber,
  }: {
    repoId: string;
    branchName: string;
    filePath: string;
    lineNumber: number;
  },
  updater: (lc: LineComments) => LineComments | null,
): LineComments[] {
  const updated = lineComments
    .map(lc => {
      if (
        lc.repoId === repoId &&
        lc.branchName === branchName &&
        lc.filePath === filePath &&
        lc.lineNumber === lineNumber
      ) {
        return updater(lc);
      }
      return lc;
    })
    .filter((lc): lc is LineComments => lc !== null);

  return updated;
}

/**
 * Reducer for comment-related actions
 * Consolidates complex comment management logic from App.tsx
 */
export function commentsReducer(repos: Repo[], action: CommentAction): Repo[] {
  switch (action.type) {
    case 'ADD_COMMENT': {
      const { repoId, prId, body } = action.payload;

      return updateRepo(repos, repoId, repo => {
        return {
          ...repo,
          pullRequests: repo.pullRequests.map(p => {
            if (p.id !== prId) return p;
            const newComment = {
              id: Math.random().toString(36).slice(2),
              author: 'you',
              body,
              createdAt: new Date().toISOString(),
            };
            return { ...p, comments: [...p.comments, newComment] };
          }),
        };
      });
    }

    case 'ADD_LINE_COMMENT': {
      const { repoId, branchName, filePath, lineNumber, body, parentId } =
        action.payload;

      return updateRepo(repos, repoId, repo => {
        const newComment: ReviewComment = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          body,
          createdAt: new Date().toISOString(),
          parentId,
        };

        const existingComments = repo.reviewComments || [];
        const existingLineComment = existingComments.find(
          lc =>
            lc.repoId === repoId &&
            lc.branchName === branchName &&
            lc.filePath === filePath &&
            lc.lineNumber === lineNumber,
        );

        let updatedComments: LineComments[];
        if (existingLineComment) {
          updatedComments = existingComments.map(lc =>
            lc === existingLineComment
              ? { ...lc, comments: [...lc.comments, newComment] }
              : lc,
          );
        } else {
          updatedComments = [
            ...existingComments,
            {
              repoId,
              branchName,
              filePath,
              lineNumber,
              comments: [newComment],
            },
          ];
        }

        return { ...repo, reviewComments: updatedComments };
      });
    }

    case 'EDIT_LINE_COMMENT': {
      const { repoId, branchName, filePath, lineNumber, commentId, body } =
        action.payload;

      return updateRepo(repos, repoId, repo => {
        const updatedComments = updateLineComment(
          repo.reviewComments || [],
          { repoId, branchName, filePath, lineNumber },
          lc => ({
            ...lc,
            comments: lc.comments.map(c =>
              c.id === commentId
                ? { ...c, body, updatedAt: new Date().toISOString() }
                : c,
            ),
          }),
        );

        return { ...repo, reviewComments: updatedComments };
      });
    }

    case 'DELETE_LINE_COMMENT': {
      const { repoId, branchName, filePath, lineNumber, commentId } =
        action.payload;

      return updateRepo(repos, repoId, repo => {
        const updatedComments = updateLineComment(
          repo.reviewComments || [],
          { repoId, branchName, filePath, lineNumber },
          lc => {
            const filteredComments = lc.comments.filter(
              c => c.id !== commentId,
            );
            return filteredComments.length > 0
              ? { ...lc, comments: filteredComments }
              : null;
          },
        );

        return { ...repo, reviewComments: updatedComments };
      });
    }

    case 'TOGGLE_RESOLVE_LINE_COMMENT': {
      const { repoId, branchName, filePath, lineNumber } = action.payload;

      return updateRepo(repos, repoId, repo => {
        const updatedComments = updateLineComment(
          repo.reviewComments || [],
          { repoId, branchName, filePath, lineNumber },
          lc => {
            const currentlyResolved = lc.comments[0]?.isResolved;
            return {
              ...lc,
              comments: lc.comments.map(c => ({
                ...c,
                isResolved: !currentlyResolved,
              })),
            };
          },
        );

        return { ...repo, reviewComments: updatedComments };
      });
    }

    default:
      return repos;
  }
}
