<!--
SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
SPDX-License-Identifier: GPL-3.0-or-later
-->

# Release Workflow and Project Management

This document describes the complete release cycle and workflow for the Text Clock GNOME Shell extension, from development to distribution across multiple channels.

## 📋 Table of Contents

- [Release Overview](#release-overview)
- [Pre-Release Checklist](#pre-release-checklist)
- [Release Process](#release-process)
- [Makefile Reference](#makefile-reference)

## 🚀 Release Overview

The project follows a structured release process with automated version management, comprehensive testing, and multi-channel distribution:

1. **Development** happens on feature branches created from version bump branches
2. **Releases** are triggered from the main branch and create GitHub releases automatically
3. **Version bumps** create new development branches with updated version numbers for the next cycle
4. **Distribution** happens through multiple channels: GitHub, AUR, and extensions.gnome.org

## ✅ Pre-Release Checklist

Before triggering any release, ensure the following housekeeping tasks are complete:

### Documentation

- [ ] RELEASE_NOTES.md updated with new features/fixes
- [ ] README.md reflects current features and compatibility
- [ ] Version compatibility verified (currently GNOME Shell 45+)

### Translations

- [ ] Translation template updated: `make i18n-update`
- [ ] Existing translations reviewed and updated in `po/` folder
- [ ] New strings marked for translation using gettext utilities
- [ ] Translation compilation tested: `make i18n-compile`

## 🔄 Release Process

### 1. Initiate Complete Release

When your development work is complete on a version branch:

```bash
# From your development branch (e.g., v1.0.7)
make release-full        # Interactive - prompts for confirmation
# OR
make release-full-auto   # Automated - no prompts, auto-accepts all
```

This orchestrates the entire release process by calling individual targets in sequence:

#### Create Pull Request

```bash
make create-pr        # Create PR from current branch to main
make create-pr-draft  # Create draft PR (for testing CI first)
```


`gh pr create --base main --head BRANCH_NAME --title "Release vX.Y.Z"`

- Uses `gh pr create` to open the pull request from your development branch to main
- Sets title: "Release v{version}"
- Provides automated description
- **No arguments needed** - automatically uses current branch

#### Validation (GitHub Actions)

Automated validation runs in GitHub Actions when PR is created:

- **Linting**: `make lint` (ESLint TypeScript validation)
- **Test Coverage**: `make coverage` (runs full test suite with coverage reporting)
- **Build validation**: `make build` (TypeScript compilation + packaging)
- **Translation check**: `make pot` (generates/validates translation files)
- **Dependency validation**: `make check-deps`
- **Local validation** can be run with: `make validate` (lint + test + build)
- **Blocks merge** if any checks fail

#### Merge to Main

```bash
make merge-pr         # Merge the current branch's PR
make wait-for-ci      # Wait for status checks to pass first
```

`gh pr merge`

- `gh pr merge --auto --squash` merges the PR
- Switches to main branch automatically
- Pulls latest changes

#### GitHub Release

```bash
make release-gh       # Create GitHub release (with prompts)
make release-gh-auto  # Create GitHub release (auto-accept)
```

- **No arguments needed** - reads version from `package.json`
- Creates git tag `v{version}`
- GitHub Actions generate release notes
- Builds and attaches extension ZIP file (`text-clock@benica.dev.zip`)
- Generates SHA256 checksums for integrity verification

#### AUR Package Update

```bash
make update-aur       # Update AUR package (with prompts)
make update-aur-auto  # Update AUR package (auto-accept)
```

- Downloads GitHub release ZIP
- Calculates SHA256 checksums
- Updates `PKGBUILD` and `.SRCINFO` files
- Tests package build
- Commits changes to AUR repository
- **Prompts for push confirmation** _(unless using `-auto`)_

### 2. Manual Extension Submission

```bash
# Create ZIP for manual submission
make pack
```

Then submit the ZIP file to https://extensions.gnome.org/upload/

### 3. Start Next Development Cycle

```bash
# Start development for next version
make start-dev-branch TYPE=patch   # 1.1.0 → 1.1.1
```

This creates a new development branch with incremented version numbers.

### 4. Version Updates During Development

If you realize your version branch needs a different version number (e.g., started as v1.1.1 but should be v1.2.0):

```bash
# Preview what would change
make update-version-dry TYPE=minor

# Update version on current branch
make update-version TYPE=minor

# Update version AND rename branch to match
make update-version-rename TYPE=minor

# Skip confirmation prompts
make update-version-force TYPE=patch

# Update files only (no git operations)
make update-version-files-only TYPE=minor

# Preview files-only update
make update-version-files-only-dry TYPE=minor

# Files-only update without confirmation
make update-version-files-only-force TYPE=minor
```

**What gets updated:**
- `package.json` - main version field
- `metadata.json` - version-name and version number
- `README.md` - all version references and download links  
- `aur/PKGBUILD` - package version
- `RELEASE_NOTES.md` - header version
- `po/*.po` files - project version strings
- Script examples in documentation

**Script Options:**
- **Default**: Update files and commit with git
- **`--rename-branch`**: Also rename current branch to match new version
- **`--no-git`**: Update files only, no git operations (no commit, no branch rename)
- **`--dry-run`**: Preview changes without executing
- **`--force`**: Skip confirmation prompts

**Files-only mode** is perfect when:
- You have uncommitted changes you don't want to lose
- You want to review version updates before committing
- You're updating version numbers as part of a larger set of changes
- You want to handle git operations manually

**When to use each mode:**
- `update-version` - Standard case: clean working directory, ready to commit
- `update-version-rename` - When you also need to rename the branch
- `update-version-files-only` - When you have uncommitted work or want manual git control
- `*-dry` variants - Always safe to run for previewing changes
