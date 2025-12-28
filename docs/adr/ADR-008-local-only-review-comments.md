# ADR-008: Local-Only Inline Review Comments

## Status
Approved

## Context
Inline code review comments are a new feature enabling developers to annotate code changes during local branch review. Options include syncing comments to GitHub/GitLab APIs, exporting to files (.md, .txt), or keeping them local-only in application state. API integration adds complexity, requires authentication, and conflicts with the privacy-first principle. File export creates filesystem clutter. Local-only storage aligns with the app's focus on private, offline review workflows.

## Decision
Store inline review comments in NSUserDefaults alongside repository state (as part of `repos` array). Comments are keyed by repository ID, branch name, file path, and line number. No server sync, no file export. Comments are local-only and ephemeral to the application state.

## Allowed
- **ReviewComment storage** in `Repo.reviewComments` array:
  ```typescript
  interface ReviewComment {
    id: string                 // UUID
    repoId: string             // Repository ID
    branchName: string         // Branch name
    filePath: string           // Relative file path
    lineNumber: number         // Line number in diff
    body: string               // Comment text
    createdAt: string          // ISO timestamp
    updatedAt?: string         // ISO timestamp
    isResolved: boolean        // Resolved flag
    parentId?: string          // For threaded replies
  }
  ```
- **Comment keying** by: `repoId` + `branchName` + `filePath` + `lineNumber`
- **Threaded replies** via `parentId` field (points to parent comment ID)
- **Local-only CRUD operations**:
  - Create: Add comment to specific line
  - Read: Display comments inline in diff view
  - Update: Edit comment body (updates `updatedAt`)
  - Delete: Remove comment from array
  - Resolve: Toggle `isResolved` flag
- **Persistence** via `src/storage.ts` (same as repo state)
- **UI in BranchDetails component**:
  - Display comments inline next to diff lines
  - "Add comment" button on each line
  - Comment thread expansion/collapse
  - Edit/delete/resolve actions

## Prohibited
- **Syncing comments to GitHub/GitLab** via API
- **Exporting comments to files** (.md, .txt, .json)
- **Importing comments from external sources** (GitHub, files, etc.)
- **Sharing comments between users** (no collaboration features)
- **Cloud backup of comments** (iCloud, Dropbox, etc.)
- **Comment notifications or webhooks** (no external integrations)
- **Git commit comments** (comments are not written to git repository)
- **Comment search across repositories** (must select repo/branch first)
- **Comment history or version tracking** (only current state saved)

## Consequences

### Positive
- **Simple implementation**: No API integration, authentication, or network code
- **Privacy-focused**: Comments stay on local machine, never sent to servers
- **Fast and responsive**: No network latency for comment operations
- **Offline-capable**: Works without internet connection
- **No API rate limits**: Unlimited local comments
- **Easy to prototype**: Can experiment with review workflows without server commitment
- **Zero external dependencies**: No GitHub/GitLab SDK or API keys

### Negative
- **Switching machines loses comments**: No cloud sync or export
- **No collaboration**: Can't share comments with teammates
- **No backup**: Comments lost if NSUserDefaults corrupted or app deleted
- **No integration with GitHub PR comments**: Separate from actual PR feedback
- **Limited discoverability**: Comments only visible in Branch Reviewer app
- **No comment analytics**: Can't track comment patterns across projects

## Enforcement

### Code Review
- **BLOCKING**: Network calls for comment sync must be rejected
- **BLOCKING**: File I/O for comment export must be rejected
- **BLOCKING**: External API integrations (GitHub, GitLab) for comments
- Comments must persist via `src/storage.ts` only (NSUserDefaults)
- Verify comment data structure matches TypeScript `ReviewComment` interface

### Data Model
- Comments stored in `Repo.reviewComments: ReviewComment[]` array
- Comments must include: `repoId`, `branchName`, `filePath`, `lineNumber`
- UUID generation for comment IDs (not auto-increment)
- ISO 8601 timestamps for `createdAt` and `updatedAt`

### UI/UX
- Comments displayed inline in `BranchDetails` component
- "Add comment" affordance on each diff line
- Clear visual distinction between resolved and unresolved comments
- Confirmation before deleting comments (prevent accidental loss)

### Testing
- Test comment CRUD operations (create, read, update, delete, resolve)
- Test threaded replies (`parentId` linking)
- Test comment persistence across app restarts
- Test comment filtering by repo/branch/file
- Test edge cases: very long comments, special characters, empty comments

### Future Considerations

If collaboration features are needed later (requires new ADR):
1. **Export to Markdown**: Save comments as .md files for sharing
2. **GitHub API integration**: Post comments to actual PR (requires auth)
3. **Cloud sync**: iCloud or custom backend for multi-device access
4. **Import from GitHub**: Fetch existing PR comments for local reference

Any of these would require:
- Superseding this ADR with new decision
- Adding appropriate dependencies (GitHub SDK, network layer, etc.)
- Privacy and security review (API tokens, data storage, etc.)
