<!--
SPDX-FileCopyrightText: Arch Linux contributors
SPDX-License-Identifier: 0BSD
-->

# Arch Linux Packaging Guidelines Compliance

This document outlines how the `gnome-shell-extension-text-clock` AUR package complies with Arch Linux packaging guidelines.

## Package Guidelines Compliance

### 1. Package Etiquette ✅

- ✅ No installation to `/usr/local/`
- ✅ No custom variables/functions (all standard PKGBUILD variables)
- ✅ Uses `/usr/share/gnome-shell/extensions/` (not `/usr/libexec/`)
- ✅ No use of makepkg subroutines (error, msg, etc.)
- ✅ All variables properly quoted (`"$pkgdir"`, `"$srcdir"`)
- ✅ Line length under 100 characters
- ✅ Standard PKGBUILD field order maintained

### 2. Package Naming ✅

- ✅ Package name: `gnome-shell-extension-text-clock`
- ✅ Contains only alphanumeric characters and hyphens
- ✅ Does not start with hyphen or dot
- ✅ All lowercase
- ✅ Follows GNOME extension naming convention

### 3. Package Versioning ✅

- ✅ `pkgver` matches upstream version (semantic versioning)
- ✅ `pkgrel` starts at 1 for new versions
- ✅ No hyphens in version strings
- ✅ Version follows pattern: X.Y.Z

### 4. Package Dependencies ✅

- ✅ Only direct dependencies listed: `gnome-shell`
- ✅ No transitive dependencies
- ✅ No redundant dependencies (removed `unzip` as it's in base system)

### 5. Package Relations ✅

- ✅ No self-reference in `provides`
- ✅ No self-reference in `conflicts`
- ✅ No inappropriate use of `replaces`

### 6. Package Sources ✅

- ✅ HTTPS source URL: `https://github.com/...`
- ✅ Source integrity verified with SHA256 checksums
- ✅ Update script uses proper checksum calculation
- ✅ Source URL pattern allows for version updates
- ✅ Uses GitHub releases (stable source)

### 7. Architecture ✅

- ✅ Uses `arch=('any')` for architecture-independent package
- ✅ Extension consists of JavaScript/JSON files only

### 8. Licenses ✅

- ✅ Uses SPDX license format: `LGPL-3.0-or-later`
- ✅ License matches upstream project license
- ✅ Package source license: 0BSD (LICENSE file provided)

### 9. Directories ✅

- ✅ Installs to standard location: `/usr/share/gnome-shell/extensions/`
- ✅ No forbidden directories used
- ✅ Follows FHS (Filesystem Hierarchy Standard)

### 10. Package Description ✅

- ✅ Description: "A simple text clock for the GNOME Shell top panel"
- ✅ Under 80 characters
- ✅ No self-referencing package name
- ✅ Clear and descriptive

## AUR Submission Guidelines Compliance

### 1. Submission Rules ✅

- ✅ Package not in official repositories
- ✅ Unique package name (checked AUR)
- ✅ Useful for multiple users (GNOME Shell extension)
- ✅ Supports x86_64 architecture (`any` works on all arches)
- ✅ Builds from sources (GitHub release ZIP)
- ✅ Proper maintainer comment format with obfuscated email

### 2. Package Content ✅

- ✅ PKGBUILD follows standards
- ✅ .SRCINFO generated and included
- ✅ LICENSE file (0BSD) for package sources
- ✅ Automation script for updates

### 3. Maintenance Ready ✅

- ✅ Update script for version bumps
- ✅ Proper SHA256 checksum handling
- ✅ Git-ready structure for AUR submission
- ✅ Clear commit message format in update instructions

## Files Included

1. **PKGBUILD** - Main build script
2. **.SRCINFO** - Package metadata for AUR
3. **LICENSE** - 0BSD license for package sources
4. **update-aur.sh** - Automation script for updates
5. **COMPLIANCE.md** - This compliance document

## Quality Assurance

The package follows all mandatory guidelines and best practices:

- Source integrity verification
- Proper dependency management
- Standard directory layout
- SPDX license format
- Automated update workflow
- Clear documentation

## Testing

Before submission, the package should be tested:

```bash
# Build test
makepkg

# Install test
makepkg -si

# Verify extension loads
gnome-extensions list | grep text-clock@benica.dev
```

## Submission Process

1. Clone AUR repository: `git clone ssh://aur@aur.archlinux.org/gnome-shell-extension-text-clock.git`
2. Copy package files to cloned directory
3. Add files: `git add PKGBUILD .SRCINFO LICENSE`
4. Commit: `git commit -m "Initial import of gnome-shell-extension-text-clock 1.0.6"`
5. Push: `git push`

This package is ready for AUR submission and complies with all relevant guidelines.
