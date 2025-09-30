#!/bin/bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -euo pipefail

# Sync aur/ directory to local AUR clone repository
#
# --dry-run          Perform a trial run with no changes made
# --commit           Commit changes to the AUR clone repository
# --push             Push changes to the AUR (requires --commit)
# --update           Update .SRCINFO using the project's update-aur.sh script
# --version X.Y.Z    Specify version to use when updating .SRCINFO (overrides reading from package.json)
# --yes              Assume yes to all prompts
# --init             Allow initial sync to an empty AUR clone directory (no PKGBUILD). Fails if PKGBUILD already exists.
#                       if the directory basename matches the expected AUR package name
# --aur-repo <path>  Path to local AUR clone repository (default: ~/Development/gnome-shell-extension-text-clock)
#
# Usage: scripts/sync-to-aur.sh [--dry-run] [--commit] [--push] [--update] [--version X.Y.Z] [--yes] [--init] [--aur-repo <path>]

DRY_RUN=false
COMMIT=false
PUSH=false
ASSUME_YES=false
INIT=false
UPDATE=false
VERSION_OVERRIDE=""
# Allow overriding the expected basename when needed via env
EXPECTED_BASENAME="${EXPECTED_BASENAME:-gnome-shell-extension-text-clock}"
AUR_REPO="${AUR_REPO:-$HOME/Development/gnome-shell-extension-text-clock}"

# Parse arguments (single loop)
while [[ $# -gt 0 ]]; do
  case "$1" in
  --dry-run) DRY_RUN=true; shift ;;
  --commit) COMMIT=true; shift ;;
  --push) PUSH=true; shift ;;
  --update) UPDATE=true; shift ;;
  --version) VERSION_OVERRIDE="$2"; shift 2 ;;
  --version=*) VERSION_OVERRIDE="${1#*=}"; shift ;;
    --aur-repo)
      if [[ -n "${2:-}" ]]; then
        AUR_REPO="$2"
        shift 2
      else
        echo "Error: --aur-repo requires a path argument" >&2
        exit 1
      fi
      ;;
    --yes) ASSUME_YES=true; shift ;;
    --init) INIT=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--commit] [--push] [--update] [--version X.Y.Z] [--yes] [--init] [--aur-repo <path>]"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)

# Basic sanity checks
command -v rsync >/dev/null 2>&1 || { echo "Error: rsync is required" >&2; exit 1; }

# REUSE compliance check for aur/ directory
echo "Checking REUSE compliance for aur/ directory..."
if ! command -v reuse >/dev/null 2>&1; then
  echo "Error: reuse tool is required for AUR sync compliance checking" >&2
  echo "Install with: pip install reuse" >&2
  exit 1
fi

if ! (cd "$PROJECT_ROOT/aur" && reuse lint --quiet); then
  echo "Error: REUSE compliance check failed for aur/ directory" >&2
  echo "Run 'reuse lint' in the aur/ directory to see specific issues" >&2
  exit 1
fi
echo "✓ REUSE compliance check passed"
# Namcap check: lint the AUR PKGBUILD
echo "Running namcap on aur/PKGBUILD..."
if ! command -v namcap >/dev/null 2>&1; then
  echo "Error: namcap is required to lint the AUR PKGBUILD" >&2
  echo "Install with: sudo pacman -S namcap" >&2
  exit 1
fi

if ! namcap "$PROJECT_ROOT/aur/PKGBUILD"; then
  echo "Error: namcap found issues in aur/PKGBUILD. Fix them before syncing to AUR." >&2
  exit 1
fi
echo "✓ namcap check passed"

# Build the package in a temporary directory to verify makepkg -si works and run namcap on the produced package
MAKEPKG_INSTALL="${MAKEPKG_INSTALL:-false}"
echo "Verifying package build with makepkg (MAKEPKG_INSTALL=${MAKEPKG_INSTALL})..."
if ! command -v makepkg >/dev/null 2>&1; then
  echo "Error: makepkg is required to validate the PKGBUILD" >&2
  echo "Install the 'pacman' / base-devel toolchain on Arch to get makepkg" >&2
  exit 1
fi

TMP_BUILD_DIR=$(mktemp -d)
echo "Using temporary build dir: $TMP_BUILD_DIR"
cp -a "$PROJECT_ROOT/aur/". "$TMP_BUILD_DIR/"
pushd "$TMP_BUILD_DIR" >/dev/null

MAKEPKG_FLAGS="-s --noconfirm"
if [[ "$MAKEPKG_INSTALL" == "true" ]]; then
  MAKEPKG_FLAGS="-si --noconfirm"
fi

# Remove any pre-existing package artifacts that could cause makepkg to abort
rm -f *.pkg.* 2>/dev/null || true

if ! makepkg $MAKEPKG_FLAGS; then
  echo "Error: makepkg failed in temporary build dir ($TMP_BUILD_DIR). Fix PKGBUILD/build issues before syncing." >&2
  popd >/dev/null || true
  rm -rf "$TMP_BUILD_DIR"
  exit 1
fi

# Find the produced package file
PKGFILE=$(ls -1 *.pkg.* 2>/dev/null | tail -n1 || true)
if [[ -z "$PKGFILE" ]]; then
  echo "Error: no package file produced by makepkg; cannot run namcap on package" >&2
  popd >/dev/null || true
  rm -rf "$TMP_BUILD_DIR"
  exit 1
fi

echo "Running namcap on built package: $PKGFILE"
if ! command -v namcap >/dev/null 2>&1; then
  echo "Error: namcap is required to lint built packages" >&2
  echo "Install with: sudo pacman -S namcap" >&2
  popd >/dev/null || true
  rm -rf "$TMP_BUILD_DIR"
  exit 1
fi

if ! namcap "$PKGFILE"; then
  echo "Error: namcap found issues in built package ($PKGFILE). Fix them before syncing to AUR." >&2
  popd >/dev/null || true
  rm -rf "$TMP_BUILD_DIR"
  exit 1
fi

echo "✓ Built package namcap check passed"
popd >/dev/null || true
rm -rf "$TMP_BUILD_DIR"

if [[ ! -d "$AUR_REPO" ]]; then
  echo "AUR repo not found at: $AUR_REPO" >&2
  echo "Please clone it first: git clone ssh://aur@aur.archlinux.org/gnome-shell-extension-text-clock.git $AUR_REPO" >&2
  exit 1
fi

echo "Syncing aur/ to AUR repo: $AUR_REPO"

# Safety: ensure the destination looks like an AUR repo (has a PKGBUILD)
if [[ ! -f "$AUR_REPO/PKGBUILD" ]]; then
  if [[ "$INIT" == true ]]; then
    BASENAME="$(basename "$AUR_REPO")"
    if [[ "$BASENAME" != "$EXPECTED_BASENAME" ]]; then
      echo "Error: AUR repo missing PKGBUILD and destination basename is '$BASENAME' (expected '$EXPECTED_BASENAME')." >&2
      echo "Either rename the directory to '$EXPECTED_BASENAME' or omit --init and point to the real AUR clone." >&2
      exit 1
    fi
    echo "PKGBUILD missing but --init provided and destination basename matches '$EXPECTED_BASENAME'. Proceeding with initial sync."
  else
    echo "Error: Destination AUR_REPO does not contain a PKGBUILD file. Aborting to prevent accidental deletion." >&2
    echo "If this is the first-time sync for a freshly-created AUR clone directory, re-run with --init." >&2
    exit 1
  fi
else
  # PKGBUILD exists - --init should not be used
  if [[ "$INIT" == true ]]; then
    echo "Error: PKGBUILD already exists in $AUR_REPO. --init should only be used for initial sync to empty AUR directories." >&2
    echo "Use 'make sync-aur' instead of 'make sync-aur-init' for subsequent updates." >&2
    exit 1
  fi
fi

# Perform the copy (exclude build artifacts and zips)
# Verify the AUR repo git remote refers to aur.archlinux.org to avoid accidental sync
if [[ -d "$AUR_REPO/.git" ]]; then
  if git -C "$AUR_REPO" remote -v | grep -q "aur.archlinux.org"; then
    echo "AUR remote verified in $AUR_REPO"
  else
    echo "Warning: AUR repo at $AUR_REPO does not appear to have an aur.archlinux.org remote." >&2
    echo "Remote output:" >&2
    git -C "$AUR_REPO" remote -v >&2 || true
    echo "Aborting to avoid accidental destructive sync. If you are sure, re-run with --yes or set AUR_REPO explicitly." >&2
    exit 1
  fi
else
  echo "Warning: $AUR_REPO does not appear to be a git repository. Aborting." >&2
  exit 1
fi

# Check if this is a dry run - if so, just preview and exit
if [[ "$DRY_RUN" == true ]]; then
  echo "Performing dry-run to preview changes..."
  rsync -av --delete --dry-run --itemize-changes --exclude='pkg/' --exclude='*.zip' --exclude='.git/' "$PROJECT_ROOT/aur/" "$AUR_REPO/"
  echo "Dry run: files would be copied to $AUR_REPO but no actual changes made"
  exit 0
fi

# For actual runs, do safety check first
echo "Performing safety check for potential deletions..."
DRY_OUTPUT=$(rsync -av --delete --dry-run --itemize-changes --exclude='pkg/' --exclude='*.zip' --exclude='.git/' "$PROJECT_ROOT/aur/" "$AUR_REPO/" 2>&1)
echo "$DRY_OUTPUT"

if echo "$DRY_OUTPUT" | grep -q "^\*deleting"; then
  echo "Detected deletions in safety check." >&2
  if [[ "$ASSUME_YES" != true && "$COMMIT" != true ]]; then
    echo "Aborting: run again with --yes to allow deletions, or run --dry-run to inspect changes." >&2
    exit 2
  else
    echo "Proceeding despite deletions because --yes or --commit was provided."
  fi
fi

# Perform the actual copy (exclude build artifacts and zips)
rsync -av --delete --exclude='pkg/' --exclude='*.zip' --exclude='.git/' "$PROJECT_ROOT/aur/" "$AUR_REPO/"

# Read package version once
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required to read package.json" >&2
  exit 1
fi
if [[ -n "$VERSION_OVERRIDE" ]]; then
  VERSION="$VERSION_OVERRIDE"
else
  VERSION=$(cd "$PROJECT_ROOT" && node -pe "require('./package.json').version" 2>/dev/null || true)
fi
if [[ -z "$VERSION" ]]; then
  echo "Error: Could not read version from package.json" >&2
  exit 1
fi

cd "$AUR_REPO"

# Update PKGBUILD/.SRCINFO using the project's helper if available
if [[ "$UPDATE" == true ]]; then
  if [[ -x "$PROJECT_ROOT/aur/update-aur.sh" ]]; then
    echo "Running update-aur.sh to refresh PKGBUILD/.SRCINFO (version: $VERSION)"
    if ! "$PROJECT_ROOT/aur/update-aur.sh" "$VERSION"; then
      echo "Error: update-aur.sh failed. Aborting sync; no commit/push will be performed." >&2
      exit 1
    fi
  else
    echo "Error: aur/update-aur.sh not executable or not present; cannot update .SRCINFO" >&2
    exit 1
  fi
else
  echo "Skipping update-aur.sh (.SRCINFO) because --update not provided"
fi

if [[ "$COMMIT" == true ]]; then
  git add PKGBUILD .SRCINFO
  if git diff --cached --quiet; then
    echo "No changes to commit"
  else
    git commit -m "Update AUR package files to $VERSION"
    if [[ "$PUSH" == true ]]; then
      git push
    fi
  fi
else
  cat <<EOF
Files synchronized to AUR repo. To commit changes:
  cd $AUR_REPO && git add -A && git commit -m 'Update AUR package files to $VERSION'
EOF
fi
