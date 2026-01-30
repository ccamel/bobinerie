---
name: commit-convention
description: >
  Generate commit messages following the DAFT convention, which requires
  exactly one letter as the commit message (with exception for dependency updates
  that can use 'u: description' format). Use this skill when creating commits,
  suggesting commit messages, or validating commit message format.
---

# Commit Convention

This project uses the DAFT convention for commit messages.

## Rule

All commit messages MUST be exactly ONE letter from the following list:

- `d` → development (general code additions or improvements)
- `f` → bug fixes
- `a` → architecture and renames (structural changes, refactoring, file moves)
- `r` → readme and docs (documentation updates)
- `t` → tests (adding or modifying tests)
- `p` → deploy on prod (production deployment-related changes)
- `v` → version change (bumping version numbers)
- `u` → dependencies updates (single letter or `u: description` format for automated tools)
- `b` → binary packaging (build artifacts, releases, etc.)

**Exception:** Dependency updates can also use the `u: description` format (e.g., for dependabot commits).

## When generating commit messages

1. Analyze the changes in the commit
2. Select the MOST appropriate single letter based on the primary purpose
3. Return ONLY that letter - no description, no explanation, no additional text
4. Exceptions:
   - Merge commits starting with "Merge " are allowed as-is
   - Dependency updates can use `u: description` format (typically for automated tools like dependabot)

## Examples

Valid commits:

- `d`
- `f`
- `r`
- `u`
- `u: bump package-name from 1.0.0 to 2.0.0`
- `Merge branch 'feature' into main`

Invalid commits:

- `d: add new feature`
- `f: fix the bug`
- `fix bug`
- `development`
- `df`
- Any text other than a single letter (except `u: description` for dependencies)

## Validation

The project enforces this via commitlint. See `commitlint.config.cjs` for the implementation.

## Reference

See: <https://x.com/hazae41/status/2001986156834267231>
