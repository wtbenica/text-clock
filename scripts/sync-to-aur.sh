#!/usr/bin/env bash
set -euo pipefail

# Sync local aur/ files to AUR clone repository
# Usage: scripts/sync-to-aur.sh [--dry-run] [--commit] [--push]

DRY_RUN=false
COMMIT=false
PUSH=false
ASSUME_YES=false
INIT=false
# Allow overriding the expected basename when needed via env
EXPECTED_BASENAME="${EXPECTED_BASENAME:-gnome-shell-extension-text-clock}"
AUR_REPO="${AUR_REPO:-$HOME/Development/gnome-shell-extension-text-clock}"

# Parse arguments (single loop)
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --commit) COMMIT=true; shift ;;
    --push) PUSH=true; shift ;;
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
      echo "Usage: $0 [--dry-run] [--commit] [--push] [--yes] [--init] [--aur-repo <path>]"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)

# Basic sanity checks
command -v rsync >/dev/null 2>&1 || { echo "Error: rsync is required" >&2; exit 1; }

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

# Automatic dry-run to preview deletions. If deletions are detected, require --commit or --yes.
echo "Performing dry-run to detect potential deletions..."
DRY_OUTPUT=$(rsync -av --delete --dry-run --itemize-changes --exclude='pkg/' --exclude='*.zip' "$PROJECT_ROOT/aur/" "$AUR_REPO/" 2>&1)
echo "$DRY_OUTPUT"

if echo "$DRY_OUTPUT" | grep -q "^\*deleting"; then
  echo "Detected deletions in dry-run." >&2
  if [[ "$ASSUME_YES" != true && "$COMMIT" != true ]]; then
    echo "Aborting: run again with --yes to allow deletions, or run --dry-run to inspect changes." >&2
    exit 2
  else
    echo "Proceeding despite deletions because --yes or --commit was provided."
  fi
fi

# Perform the copy (exclude build artifacts and zips)
rsync -av --delete --exclude='pkg/' --exclude='*.zip' "$PROJECT_ROOT/aur/" "$AUR_REPO/"

if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run: files copied to $AUR_REPO but no .SRCINFO update or commits performed"
  exit 0
fi

# Read package version once
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required to read package.json" >&2
  exit 1
fi
VERSION=$(cd "$PROJECT_ROOT" && node -pe "require('./package.json').version" 2>/dev/null || true)
if [[ -z "$VERSION" ]]; then
  echo "Error: Could not read version from package.json" >&2
  exit 1
fi

cd "$AUR_REPO"

# Update PKGBUILD/.SRCINFO using the project's helper if available
if [[ -x "$PROJECT_ROOT/aur/update-aur.sh" ]]; then
  echo "Running update-aur.sh to refresh PKGBUILD/.SRCINFO"
  if ! "$PROJECT_ROOT/aur/update-aur.sh" "$VERSION"; then
    echo "Error: update-aur.sh failed. Please check the output above." >&2
    exit 1
  fi
else
  echo "Warning: aur/update-aur.sh not executable or not present; skipping auto .SRCINFO update"
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
