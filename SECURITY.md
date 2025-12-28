# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.1   | :white_check_mark: |

**Note**: As a macOS-only development tool, only the latest version receives security updates. We recommend always using the most recent release.

## Platform Requirements

- **macOS 15.0+ (Sequoia) on Apple Silicon (arm64) only**
- No support for Windows, Linux, or Intel Macs

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly:

### Reporting Process

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Create a [private security advisory](https://github.com/HarmAalbers/branchReviewer/security/advisories/new)
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if you have one)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity (critical issues prioritized)
- **Disclosure**: 90 days after initial report, or when patch is released (whichever comes first)

## Security Practices

Branch Reviewer implements several security measures:

### 1. CodeQL Code Scanning

- **Automated Analysis**: CodeQL analyzes all JavaScript/TypeScript code for security vulnerabilities
- **Continuous Monitoring**: Runs on every push, pull request, and weekly scheduled scans
- **Query Suites**: Uses `security-and-quality` query suite for comprehensive analysis
- **SARIF Reports**: Results uploaded to GitHub Security tab for tracking
- **See**: `.github/workflows/codeql.yml`

### 2. Dependency Security

- **Automated Scanning**: GitHub Dependency Review workflow runs on all pull requests
- **Blocking**: High/critical vulnerabilities block merges
- **Updates**: Dependencies regularly reviewed and updated
- **See**: `.github/workflows/dependency-review.yml`

### 3. Code Quality Gates

- **Test Coverage**: Minimum 50% coverage enforced (statements, functions, lines)
- **Type Safety**: TypeScript strict mode with no `any` escapes in critical paths
- **Pre-commit Hooks**: Automatic ESLint fixes, Prettier formatting, TypeScript validation
- **CI/CD**: All code must pass lint, type check, tests, and build before merge

### 4. Privacy-First Architecture

- **Local-Only Operations**: No data sent to remote servers
- **No Analytics**: No telemetry, tracking, or external network calls
- **Git CLI Integration**: All Git operations via local CLI, nothing uploaded
- **NSUserDefaults Storage**: User data stored locally via macOS native storage (user-controlled)

### 5. Input Validation

- **Git Repository Paths**: Validated before processing
- **File Path Sanitization**: Paths checked for traversal attempts
- **Native Module Safety**: BRGit module validates all inputs before shell execution

## Security Considerations

### Known Limitations

1. **No Sandboxing**: Git operations are not sandboxed
   - The app executes `git` commands on user-provided repository paths
   - **Risk**: Malicious `.git` directories could potentially exploit Git vulnerabilities
   - **Mitigation**: Only open repositories you trust

2. **PATH Dependency**: Relies on system `git` binary
   - The app looks for `git` on PATH (Homebrew: `/opt/homebrew/bin/git`)
   - **Risk**: If a malicious `git` binary is on PATH, it could be executed
   - **Mitigation**: Verify your PATH includes trusted locations only

3. **macOS-Only**: No cross-platform security testing
   - Security testing is limited to macOS 15+ on Apple Silicon
   - **Risk**: Platform-specific vulnerabilities may exist
   - **Mitigation**: Report platform-specific issues promptly

### Safe Usage Guidelines

✅ **DO**:

- Only open Git repositories from trusted sources
- Keep macOS and Xcode up to date
- Verify `git` binary is from Homebrew or Apple
- Review changed files before adding review comments
- Use the app on personal projects or trusted team repositories

❌ **DO NOT**:

- Open Git repositories from untrusted sources (e.g., random internet downloads)
- Use the app in CI/CD pipelines without proper sandboxing
- Store sensitive credentials in repository paths
- Assume the app sanitizes all Git repository content

## Security for Contributors

If you're contributing code to Branch Reviewer:

### Required Security Practices

1. **Never Add Network Calls**
   - This is a local-only tool (see ADR-002, ADR-008)
   - No external APIs, analytics, or cloud services
   - Violations are BLOCKING per ADR

2. **Maintain Test Coverage**
   - Coverage must not decrease below 50% (statements/functions/lines), 40% (branches)
   - Security-critical code should have 80%+ coverage
   - Add tests for edge cases and error handling

3. **Type Safety First**
   - Use TypeScript strict mode
   - No `any` types without documented justification
   - Validate external inputs (file paths, user input)

4. **Validate User Inputs**
   - All file paths from users must be validated
   - Check for path traversal attempts (`../`, absolute paths outside repo)
   - Sanitize before passing to native modules

5. **No Hardcoded Secrets**
   - Never commit API keys, tokens, or credentials
   - Use GitHub Actions secrets for CI/CD tokens (e.g., `CODECOV_TOKEN`)
   - Add sensitive patterns to `.gitignore`

### Pre-commit Hooks

Security checks run automatically on commit:

- ESLint catches common security issues (no-eval, no-unsafe-regex, etc.)
- TypeScript compiler validates types
- Prettier ensures consistent code style

**If pre-commit hooks fail**: Fix issues before committing. DO NOT bypass hooks.

## Security Acknowledgments

We appreciate responsible disclosure. Contributors who report valid security issues will be acknowledged in release notes (unless they prefer to remain anonymous).

## Additional Resources

- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [macOS Security Documentation](https://support.apple.com/guide/security/welcome/web)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)

---

**Last Updated**: 2025-12-28
