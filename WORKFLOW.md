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

- [ ] CHANGELOG.md updated with new features/fixes
- [ ] README.md reflects current features and compatibility
- [ ] Version compatibility verified (currently GNOME Shell 45+)

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

`gh pr create --base main --head BRANCH_NAME --title "Release vX.Y.Z"`

- Uses `gh pr create` to open the pull request from your development branch to main
- Sets title: "Release v{version}"
- Provides automated description

#### Validation (GitHub Actions)

Automated validation runs in GitHub Actions when PR is created:

- ESLint linting (`yarn lint`)
- REUSE compliance (`reuse lint`)
- Full validation pipeline (`make validate` or `make`)
  - TypeScript compilation
  - Runs the comprehensive test suite (unit + integration)
  - Build validation
- **Blocks merge** if any checks fail

#### Merge to Main

`gh pr merge`

- `gh pr merge --auto --squash` merges the PR
- Switches to main branch automatically
- Pulls latest changes

#### GitHub Release

`make release` or `make release-auto`

- Creates git tag `v{version}`
- GitHub Actions generate release notes
- Builds and attaches extension ZIP file (`text-clock@benica.dev.zip`)
- Calculates checksums and signatures

#### AUR Package Update

`make release-aur` or `make release-aur-auto`

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
make bump-version TYPE=patch   # 1.0.6 → 1.0.7
```

This creates a new development branch with incremented version numbers.
