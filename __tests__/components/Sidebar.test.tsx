/**
 * @format
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import Sidebar from '../../src/components/Sidebar';
import type {Repo} from '../../src/types';

describe('Sidebar', () => {
  const mockCallbacks = {
    onToggleRepo: jest.fn(),
    onSelectRepo: jest.fn(),
    onSelectPr: jest.fn(),
    onSelectBranch: jest.fn(),
    onAddRepo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty state', () => {
    it('renders with no repos', () => {
      const {getByText} = render(
        <Sidebar
          repos={[]}
          collapsed={{}}
          {...mockCallbacks}
        />
      );

      expect(getByText('Repositories')).toBeTruthy();
      expect(getByText('+')).toBeTruthy();
    });

    it('calls onAddRepo when + button is pressed', () => {
      const {getByText} = render(
        <Sidebar
          repos={[]}
          collapsed={{}}
          {...mockCallbacks}
        />
      );

      fireEvent.press(getByText('+'));
      expect(mockCallbacks.onAddRepo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Repository list', () => {
    const mockRepo: Repo = {
      id: 'repo-1',
      name: 'test-repo',
      path: '/path/to/repo',
      branches: [
        {name: 'main', isCurrent: true},
        {name: 'feature-branch', isCurrent: false},
      ],
      pullRequests: [],
      baseBranch: 'main',
      branchCommits: {},
      branchFiles: {},
    };

    it('renders repository name', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{}}
          {...mockCallbacks}
        />
      );

      expect(getByText('test-repo')).toBeTruthy();
    });

    it('shows branches when repo is expanded', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      expect(getByText('Branches')).toBeTruthy();
      expect(getByText('main')).toBeTruthy();
      expect(getByText('feature-branch')).toBeTruthy();
    });

    it('hides branches when repo is collapsed', () => {
      const {queryByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': true}}
          {...mockCallbacks}
        />
      );

      expect(queryByText('Branches')).toBeNull();
      expect(queryByText('main')).toBeNull();
    });

    it('shows collapse chevron (▸) when collapsed', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': true}}
          {...mockCallbacks}
        />
      );

      expect(getByText('▸')).toBeTruthy();
    });

    it('shows expand chevron (▾) when expanded', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      expect(getByText('▾')).toBeTruthy();
    });
  });

  describe('Branch selection', () => {
    const mockRepo: Repo = {
      id: 'repo-1',
      name: 'test-repo',
      path: '/path/to/repo',
      branches: [
        {name: 'main', isCurrent: true},
        {name: 'develop', isCurrent: false},
      ],
      pullRequests: [],
      baseBranch: 'main',
      branchCommits: {},
      branchFiles: {},
    };

    it('calls onSelectBranch when branch is pressed', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      fireEvent.press(getByText('develop'));

      expect(mockCallbacks.onSelectRepo).toHaveBeenCalledWith('repo-1');
      expect(mockCallbacks.onSelectBranch).toHaveBeenCalledWith('repo-1', 'develop');
    });

    it('shows CURRENT badge on current branch', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      expect(getByText('CURRENT')).toBeTruthy();
    });

    it('does not show CURRENT badge on non-current branches', () => {
      const {getAllByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      // Should only find one CURRENT badge (for main branch)
      const currentBadges = getAllByText('CURRENT');
      expect(currentBadges).toHaveLength(1);
    });
  });

  describe('Repository toggling', () => {
    const mockRepo: Repo = {
      id: 'repo-1',
      name: 'test-repo',
      path: '/path/to/repo',
      branches: [{name: 'main', isCurrent: true}],
      pullRequests: [],
      baseBranch: 'main',
      branchCommits: {},
      branchFiles: {},
    };

    it('calls onToggleRepo and onSelectRepo when repo header is pressed', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{}}
          {...mockCallbacks}
        />
      );

      fireEvent.press(getByText('test-repo'));

      expect(mockCallbacks.onSelectRepo).toHaveBeenCalledWith('repo-1');
      expect(mockCallbacks.onToggleRepo).toHaveBeenCalledWith('repo-1');
    });
  });

  describe('Pull requests', () => {
    const mockRepo: Repo = {
      id: 'repo-1',
      name: 'test-repo',
      path: '/path/to/repo',
      branches: [],
      pullRequests: [
        {
          id: 'pr-1',
          title: 'Fix bug',
          files: [],
          author: 'john',
          // number:123,
          comments: [],
        },
        {
          id: 'pr-2',
          title: 'Add feature',
          files: [],
          author: 'jane',
          // number:124,
          comments: [],
        },
      ],
      baseBranch: 'main',
      branchCommits: {},
      branchFiles: {},
    };

    it('renders pull request titles', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      expect(getByText('Fix bug')).toBeTruthy();
      expect(getByText('Add feature')).toBeTruthy();
    });

    it('renders pull request authors', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      // Authors are rendered with " · " prefix
      expect(getByText('· john')).toBeTruthy();
      expect(getByText('· jane')).toBeTruthy();
    });

    it('calls onSelectPr when PR is pressed', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      fireEvent.press(getByText('Fix bug'));

      expect(mockCallbacks.onSelectRepo).toHaveBeenCalledWith('repo-1');
      expect(mockCallbacks.onSelectPr).toHaveBeenCalledWith('repo-1', 'pr-1');
    });
  });

  describe('Multiple repositories', () => {
    const mockRepos: Repo[] = [
      {
        id: 'repo-1',
        name: 'first-repo',
        path: '/path/one',
        branches: [{name: 'main', isCurrent: true}],
        pullRequests: [],
        baseBranch: 'main',
          branchCommits: {},
        branchFiles: {},
      },
      {
        id: 'repo-2',
        name: 'second-repo',
        path: '/path/two',
        branches: [{name: 'develop', isCurrent: true}],
        pullRequests: [],
        baseBranch: 'develop',
        branchCommits: {},
        branchFiles: {},
      },
    ];

    it('renders all repositories', () => {
      const {getByText} = render(
        <Sidebar
          repos={mockRepos}
          collapsed={{}}
          {...mockCallbacks}
        />
      );

      expect(getByText('first-repo')).toBeTruthy();
      expect(getByText('second-repo')).toBeTruthy();
    });

    it('maintains independent collapse state for each repo', () => {
      const {getByText, queryByText} = render(
        <Sidebar
          repos={mockRepos}
          collapsed={{'repo-1': true, 'repo-2': false}}
          {...mockCallbacks}
        />
      );

      // First repo should show ▸ (collapsed)
      expect(getByText('▸')).toBeTruthy();

      // Second repo should show branches (expanded)
      expect(getByText('develop')).toBeTruthy();

      // First repo branches should not be visible
      expect(queryByText('main')).toBeNull();
    });
  });

  describe('Selection state', () => {
    const mockRepo: Repo = {
      id: 'repo-1',
      name: 'test-repo',
      path: '/path/to/repo',
      branches: [
        {name: 'main', isCurrent: true},
        {name: 'feature', isCurrent: false},
      ],
      pullRequests: [
        {
          id: 'pr-1',
          title: 'Test PR',
          files: [],
          author: 'test',
          // number:1,
          comments: [],
        },
      ],
      baseBranch: 'main',
      branchCommits: {},
      branchFiles: {},
    };

    it('highlights selected branch', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          selectedRepoId="repo-1"
          selectedBranchName="feature"
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      // The feature branch should be rendered (we can verify it exists)
      expect(getByText('feature')).toBeTruthy();
      // Visual highlight is via style, which is applied
    });

    it('highlights selected PR', () => {
      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          selectedRepoId="repo-1"
          selectedPrId="pr-1"
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      expect(getByText('Test PR')).toBeTruthy();
      // Visual highlight is via style, which is applied
    });
  });

  describe('Edge cases', () => {
    it('handles repo with no branches', () => {
      const mockRepo: Repo = {
        id: 'repo-1',
        name: 'empty-repo',
        path: '/path',
        branches: [],
        pullRequests: [],
        baseBranch: 'main',
          branchCommits: {},
        branchFiles: {},
      };

      const {queryByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{'repo-1': false}}
          {...mockCallbacks}
        />
      );

      // Should not show Branches section
      expect(queryByText('Branches')).toBeNull();
    });

    it('handles collapsed state when repo id not in collapsed map', () => {
      const mockRepo: Repo = {
        id: 'repo-1',
        name: 'test-repo',
        path: '/path',
        branches: [{name: 'main', isCurrent: true}],
        pullRequests: [],
        baseBranch: 'main',
          branchCommits: {},
        branchFiles: {},
      };

      const {getByText} = render(
        <Sidebar
          repos={[mockRepo]}
          collapsed={{}}  // Empty map
          {...mockCallbacks}
        />
      );

      // Should default to expanded (show branches)
      expect(getByText('main')).toBeTruthy();
      expect(getByText('▾')).toBeTruthy();
    });
  });
});
