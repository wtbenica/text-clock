<!--
SPDX-FileCopyrightText: Arch Linux contributors
SPDX-License-Identifier: 0BSD
-->

# AUR Package for Text Clock Extension

This directory contains the files needed to maintain the Arch User Repository (AUR) package for the Text Clock GNOME Shell extension.

## Package Information

- **Package Name**: `gnome-shell-extension-text-clock`
- **AUR Page**: https://aur.archlinux.org/packages/gnome-shell-extension-text-clock
- **Type**: Binary package (uses pre-built GitHub releases)

## Files

- `PKGBUILD` - The main package build script
- `.SRCINFO` - Generated metadata file for AUR
- `update-aur.sh` - Script to update package for new releases

## Initial AUR Submission

To submit this package to AUR for the first time:

1. **Create AUR account** at https://aur.archlinux.org/register/
2. **Add SSH key** to your AUR account
3. **Clone the AUR repository**:
   ```bash
   git clone ssh://aur@aur.archlinux.org/gnome-shell-extension-text-clock.git
   cd gnome-shell-extension-text-clock
   ```
4. **Copy package files**:
   ```bash
   cp /path/to/text-clock/aur/* .
   ```
5. **Test the package**:
   ```bash
   makepkg -si
   ```
6. **Submit to AUR**:
   ```bash
   git add .
   git commit -m "Initial import of gnome-shell-extension-text-clock"
   git push
   ```

## Updating for New Releases

When you release a new version:

1. **Update package files**:

   ```bash
   ./update-aur.sh 1.0.7  # Replace with actual version
   ```

2. **Test the updated package**:

   ```bash
   makepkg -si
   ```

3. **Commit and push**:
   ```bash
   git add -A
   git commit -m "Update to v1.0.7"
   git push
   ```

## Automation Integration

You could integrate AUR updates into your release workflow by:

1. Adding the AUR update script to your `make release` target
2. Creating a GitHub Action that updates AUR after successful releases
3. Using the existing version management system to trigger AUR updates

## Package Details

The package:

- Downloads the pre-built ZIP from GitHub releases
- Extracts to `/usr/share/gnome-shell/extensions/text-clock@benica.dev`
- Sets correct permissions
- Includes proper metadata and dependencies

## Dependencies

- `gnome-shell` - The extension host
- `unzip` - For extracting the release ZIP (build-time only)

## Installation for Users

Once published, Arch users can install with:

```bash
# Using an AUR helper (recommended)
yay -S gnome-shell-extension-text-clock

# Or manually
git clone https://aur.archlinux.org/gnome-shell-extension-text-clock.git
cd gnome-shell-extension-text-clock
makepkg -si
```
