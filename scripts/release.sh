#!/usr/bin/env bash
set -euo pipefail

# release.sh - create a git tag and push it to origin (optionally non-interactive)
# Usage: release.sh [--auto] [--version X.Y.Z]

AUTO=false
VERSION=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto)
      AUTO=true; shift;;
    --dry-run)
      DRY_RUN=true; shift;;
    --version)
      VERSION="$2"; shift 2;;
    --version=*)
      VERSION="${1#*=}"; shift;;
    -h|--help)
      echo "Usage: $0 [--auto] [--dry-run] [--version X.Y.Z]"; exit 0;;
    *)
      echo "Unknown arg: $1"; exit 2;;
  esac
done

command -v node >/dev/null 2>&1 || { echo "ERROR: node is required"; exit 2; }

if [[ -z "$VERSION" ]]; then
  VERSION=$(node -pe "require('./package.json').version")
fi

echo "Preparing GitHub release for version $VERSION"

# Check current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$DRY_RUN" = true ]]; then
  echo "(dry-run) Current branch: $current_branch"
else
  # Verify we're on main branch
  if [[ "$current_branch" != "main" ]]; then
    echo "ERROR: You must be on the main branch to release. Currently on: $current_branch"
    exit 1
  fi
  # Verify working tree is clean
  if ! git diff-index --quiet HEAD --; then
    echo "ERROR: Working tree is not clean. Please commit or stash your changes.";
    exit 1
  fi
fi

if [[ "$AUTO" != true ]]; then
  if [[ "$DRY_RUN" = true ]]; then
    echo "(dry-run) Would prompt for confirmation to release v$VERSION";
  else
    read -p "Continue with release v$VERSION? [y/N] " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      echo "Release cancelled."; exit 0
    fi
  fi
else
  echo "Auto-accepting due to --auto"
fi

echo "Running validation (make validate)..."
if [[ "$DRY_RUN" = true ]]; then
  echo "(dry-run) Would run: make validate";
else
  make validate || { echo "ERROR: Validation failed"; exit 1; }
fi

echo "Preparing tag v$VERSION..."
if [[ "$DRY_RUN" = true ]]; then
  echo "(dry-run) Would run: git tag \"v$VERSION\"";
  echo "(dry-run) Would run: git push origin \"v$VERSION\"";
else
  git tag "v$VERSION" || { echo "ERROR: Failed to create tag v$VERSION"; exit 1; }
  git push origin "v$VERSION" || { echo "ERROR: Failed to push tag v$VERSION"; exit 1; }
  echo "✅ Release tag v$VERSION pushed. GitHub Actions will create the release." 
  echo "Check the release at: https://github.com/wtbenica/text-clock/releases/tag/v$VERSION"
fi

exit 0
