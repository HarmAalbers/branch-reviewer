/**
 * @format
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {BranchDetails} from '../../src/components/BranchDetails';
import type {Commit, FileChange, LineComments} from '../../src/types';

describe('BranchDetails', () => {
  const mockCallbacks = {
    onAddComment: jest.fn(),
    onEditComment: jest.fn(),
    onDeleteComment: jest.fn(),
    onToggleResolve: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty state', () => {
    it('shows placeholder when no branch selected', () => {
      const {getByText} = render(
        <BranchDetails {...mockCallbacks} />
      );

      expect(getByText('Select a branch to view details')).toBeTruthy();
    });

    it('does not render commits or files when no branch selected', () => {
      const {queryByText} = render(
        <BranchDetails {...mockCallbacks} />
      );

      expect(queryByText('Commits')).toBeNull();
      expect(queryByText('Files changed')).toBeNull();
    });
  });

  describe('Branch header', () => {
    it('renders branch name', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature-auth"
          {...mockCallbacks}
        />
      );

      expect(getByText('feature-auth')).toBeTruthy();
    });

    it('renders base branch comparison text', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature-auth"
          baseBranch="main"
          {...mockCallbacks}
        />
      );

      expect(getByText('Comparing to main')).toBeTruthy();
    });

    it('does not render base branch text when not provided', () => {
      const {queryByText} = render(
        <BranchDetails
          branchName="feature-auth"
          {...mockCallbacks}
        />
      );

      expect(queryByText(/Comparing to/)).toBeNull();
    });
  });

  describe('Commits section', () => {
    const mockCommits: Commit[] = [
      {
        hash: 'abc123',
        author: 'John Doe',
        message: 'Add authentication',
        dateISO: '2025-12-28T10:00:00Z',
      },
      {
        hash: 'def456',
        author: 'Jane Smith',
        message: 'Fix bug in login',
        dateISO: '2025-12-27T15:30:00Z',
      },
    ];

    it('renders commit count', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          commits={mockCommits}
          {...mockCallbacks}
        />
      );

      expect(getByText('Commits (2)')).toBeTruthy();
    });

    it('renders all commit messages', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          commits={mockCommits}
          {...mockCallbacks}
        />
      );

      expect(getByText('Add authentication')).toBeTruthy();
      expect(getByText('Fix bug in login')).toBeTruthy();
    });

    it('renders commit authors and dates', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          commits={mockCommits}
          {...mockCallbacks}
        />
      );

      expect(getByText(/John Doe/)).toBeTruthy();
      expect(getByText(/Jane Smith/)).toBeTruthy();
    });

    it('shows placeholder when no commits', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          commits={[]}
          {...mockCallbacks}
        />
      );

      expect(getByText('No commits in this branch')).toBeTruthy();
    });
  });

  describe('Files changed section', () => {
    const mockFiles: FileChange[] = [
      {
        path: 'src/auth.ts',
        additions: 50,
        deletions: 10,
        patch: [
          '+  const user = getUserFromToken();',
          '+  if (!user) throw new Error("Unauthorized");',
          '-  // TODO: implement auth',
        ],
      },
      {
        path: 'src/login.tsx',
        additions: 5,
        deletions: 2,
        patch: ['+  return <LoginForm />;'],
      },
    ];

    it('renders files changed count', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          files={mockFiles}
          {...mockCallbacks}
        />
      );

      expect(getByText('Files changed (2)')).toBeTruthy();
    });

    it('renders file paths', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          files={mockFiles}
          {...mockCallbacks}
        />
      );

      expect(getByText('src/auth.ts')).toBeTruthy();
      expect(getByText('src/login.tsx')).toBeTruthy();
    });

    it('renders additions and deletions', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          files={mockFiles}
          {...mockCallbacks}
        />
      );

      expect(getByText('+50 −10')).toBeTruthy();
      expect(getByText('+5 −2')).toBeTruthy();
    });

    it('renders diff patch lines', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          files={mockFiles}
          {...mockCallbacks}
        />
      );

      expect(getByText('+  const user = getUserFromToken();')).toBeTruthy();
      expect(getByText('+  if (!user) throw new Error("Unauthorized");')).toBeTruthy();
      expect(getByText('-  // TODO: implement auth')).toBeTruthy();
    });

    it('shows placeholder when no files changed', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          files={[]}
          {...mockCallbacks}
        />
      );

      expect(getByText('No files changed in this branch')).toBeTruthy();
    });
  });

  describe('Line comments', () => {
    const mockFiles: FileChange[] = [
      {
        path: 'src/auth.ts',
        additions: 1,
        deletions: 0,
        patch: ['+  const user = getUserFromToken();'],
      },
    ];

    const mockLineComments: LineComments[] = [
      {
        repoId: 'repo-1',
        branchName: 'feature',
        filePath: 'src/auth.ts',
        lineNumber: 1,
        comments: [
          {
            id: 'comment-1',
            body: 'Should we handle null case?',
            createdAt: '2025-12-28T10:00:00Z',
          },
        ],
      },
    ];

    it('renders comment indicator badge on lines with comments', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          repoId="repo-1"
          files={mockFiles}
          lineComments={mockLineComments}
          {...mockCallbacks}
        />
      );

      // Comment count badge should show
      expect(getByText('1')).toBeTruthy();
    });

    it('always shows comment thread for lines with existing comments', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          repoId="repo-1"
          files={mockFiles}
          lineComments={mockLineComments}
          {...mockCallbacks}
        />
      );

      // Comment thread should be visible without clicking (hasComments || isActive)
      // Click the diff line to activate comment thread
      fireEvent.press(getByText('+  const user = getUserFromToken();'));

      // Comment thread should be visible
      expect(getByText('Should we handle null case?')).toBeTruthy();
    });

    it('shows comment input when clicking line without existing comments', () => {
      const filesWithoutComments: FileChange[] = [
        {
          path: 'src/new.ts',
          additions: 1,
          deletions: 0,
          patch: ['+  const newCode = true;'],
        },
      ];

      const {getByText, getByPlaceholderText} = render(
        <BranchDetails
          branchName="feature"
          repoId="repo-1"
          files={filesWithoutComments}
          lineComments={[]} // No existing comments
          {...mockCallbacks}
        />
      );

      // Click the line to activate new comment thread
      fireEvent.press(getByText('+  const newCode = true;'));

      // Comment input should appear
      expect(getByPlaceholderText('Add a comment...')).toBeTruthy();
    });

    it('filters comments by repoId and branchName', () => {
      const otherRepoComments: LineComments[] = [
        {
          repoId: 'other-repo',
          branchName: 'feature',
          filePath: 'src/auth.ts',
          lineNumber: 1,
          comments: [{id: 'c1', body: 'Other repo comment', createdAt: '2025-12-28T10:00:00Z'}],
        },
      ];

      const {queryByText} = render(
        <BranchDetails
          branchName="feature"
          repoId="repo-1"
          files={mockFiles}
          lineComments={otherRepoComments}
          {...mockCallbacks}
        />
      );

      // Should not show comment from other repo
      expect(queryByText('1')).toBeNull(); // No badge
    });

    it('only shows comment thread when onAddComment callback provided', () => {
      const {getByText, queryByText} = render(
        <BranchDetails
          branchName="feature"
          repoId="repo-1"
          files={mockFiles}
          lineComments={mockLineComments}
          // onAddComment NOT provided
          onEditComment={mockCallbacks.onEditComment}
          onDeleteComment={mockCallbacks.onDeleteComment}
          onToggleResolve={mockCallbacks.onToggleResolve}
        />
      );

      // Click the line
      fireEvent.press(getByText('+  const user = getUserFromToken();'));

      // Comment thread should NOT appear (no onAddComment callback)
      expect(queryByText('Should we handle null case?')).toBeNull();
    });
  });

  describe('Comment interaction', () => {
    const mockFiles: FileChange[] = [
      {
        path: 'test.ts',
        additions: 1,
        deletions: 0,
        patch: ['+  const foo = 123;'],
      },
    ];

    const mockLineComments: LineComments[] = [
      {
        repoId: 'repo-1',
        branchName: 'feat',
        filePath: 'test.ts',
        lineNumber: 1,
        comments: [
          {id: 'c1', body: 'Test comment', createdAt: '2025-12-28T10:00:00Z'},
        ],
      },
    ];

    it('passes correct props to CommentThread', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feat"
          repoId="repo-1"
          files={mockFiles}
          lineComments={mockLineComments}
          {...mockCallbacks}
        />
      );

      // Click line to show thread
      fireEvent.press(getByText('+  const foo = 123;'));

      // CommentThread should be rendered with comment
      expect(getByText('Test comment')).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('handles undefined commits gracefully', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          commits={undefined}
          {...mockCallbacks}
        />
      );

      expect(getByText('Commits (0)')).toBeTruthy();
      expect(getByText('No commits in this branch')).toBeTruthy();
    });

    it('handles undefined files gracefully', () => {
      const {getByText} = render(
        <BranchDetails
          branchName="feature"
          files={undefined}
          {...mockCallbacks}
        />
      );

      expect(getByText('Files changed (0)')).toBeTruthy();
      expect(getByText('No files changed in this branch')).toBeTruthy();
    });

    it('handles empty lineComments array', () => {
      const mockFiles: FileChange[] = [
        {
          path: 'test.ts',
          additions: 1,
          deletions: 0,
          patch: ['+  test'],
        },
      ];

      const {queryByText} = render(
        <BranchDetails
          branchName="feat"
          repoId="repo-1"
          files={mockFiles}
          lineComments={[]}
          {...mockCallbacks}
        />
      );

      // Should not crash, no comment badges
      expect(queryByText('1')).toBeNull();
    });
  });
});
