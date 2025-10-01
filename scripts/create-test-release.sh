#!/bin/bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Create a test GitHub release (draft/prerelease)
# This simulates the full release pipeline but creates a draft release that can be run from any branch
# Usage: create-test-release.sh [--version X.Y.Z-test] [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
source "$SCRIPT_DIR/lib/common.sh"


VERSION=""
TAG=""
DRY_RUN=false


while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)
            VERSION="$2"; shift 2 ;;
        --version=*)
            VERSION="${1#*=}"; shift ;;
        --tag)
            TAG="$2"; shift 2 ;;
        --tag=*)
            TAG="${1#*=}"; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help)
            echo "Usage: $0 [--version X.Y.Z-test] [--tag TAG] [--dry-run]"
            echo "Create a test GitHub release (draft/prerelease) for the specified version or tag."
            echo "If no version or tag specified, uses current version with '-test' suffix."
            exit 0
            ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done


# If TAG is provided, use it for VERSION and ZIP naming
if [[ -n "$TAG" ]]; then
    VERSION="$TAG"
else
    if [[ -z "$VERSION" ]]; then
        BASE_VERSION="$(get_current_version)"
        VERSION="${BASE_VERSION}-test"
    fi
fi


log_info "Creating test release for version $VERSION"

if [[ "$DRY_RUN" == true ]]; then
    log_warn "DRY RUN MODE - No release will be created"
    echo "Would run: make validate"
    echo "Would run: make pack"
    echo "Would sign ZIP if GPG_PRIVATE_KEY available"
    echo "Would create draft GitHub release with prerelease flag"
    exit 0
fi

require_clean_worktree
require_gh_cli

# Run validations (same as PR/CI)
log_step "Running validations..."
make validate

# Create release package
log_step "Creating release package..."
make pack


# Prepare ZIP filenames
BASE_VERSION="$(get_current_version)"
BASE_FILE="text-clock@benica.dev-${BASE_VERSION}.zip"
ZIP_FILE_VERSIONED="text-clock@benica.dev-${VERSION}.zip"
ZIP_FILE_UNVERSIONED="text-clock@benica.dev.zip"
# Copy the produced versioned zip to an unversioned name for the GitHub release asset
if [[ -f "$BASE_FILE" ]]; then
    cp -f "$BASE_FILE" "$ZIP_FILE_UNVERSIONED"
else
    log_warn "Expected $BASE_FILE not found; attempting to find any matching zip"
    FOUND=$(ls text-clock@benica.dev-*.zip 2>/dev/null | head -n1 || true)
    if [[ -n "$FOUND" ]]; then
        cp -f "$FOUND" "$ZIP_FILE_UNVERSIONED"
    else
        log_error "No zip file found to upload"
        exit 1
    fi
fi

# Sign if GPG key available (simulate CI signing)
if [[ -n "${GPG_PRIVATE_KEY:-}" ]]; then
    log_step "Signing release ZIP..."
    echo "$GPG_PRIVATE_KEY" | gpg --batch --import
    set -euo pipefail
    sigfile="$ZIP_FILE_UNVERSIONED.sig"
    gpg --batch --yes --output "$sigfile" --detach-sign "$ZIP_FILE_UNVERSIONED"
    FILES_ARG="$ZIP_FILE_UNVERSIONED $sigfile"
else
    log_warn "No GPG_PRIVATE_KEY provided - release will be unsigned"
    FILES_ARG="$ZIP_FILE_UNVERSIONED"
fi


# Generate release notes: use RELEASE_NOTES.md if present, else fallback to commit list
log_step "Generating release notes..."
if [[ -f RELEASE_NOTES.md ]]; then
    log_info "Using RELEASE_NOTES.md for release notes."
    NOTES="$(cat RELEASE_NOTES.md)"
else
    if git describe --tags --abbrev=0 HEAD~1 >/dev/null 2>&1; then
        PREV_TAG=$(git describe --tags --abbrev=0 HEAD~1)
        NOTES="## Test Release $VERSION

This is a test release from branch: $(get_current_branch)

## Changes since $PREV_TAG
$(git log --pretty=format="- %s" $PREV_TAG..HEAD)

## Build Info
- Branch: $(get_current_branch)
- Commit: $(git rev-parse --short HEAD)
- Built: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
"
    else
        NOTES="## Test Release $VERSION

This is a test release from branch: $(get_current_branch)

## Initial Test Release
- Branch: $(get_current_branch)
- Commit: $(git rev-parse --short HEAD)
- Built: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
"
    fi
fi

# Create draft GitHub release
log_step "Creating draft GitHub release..."
gh release create "v$VERSION" \
    --title "Test Release v$VERSION" \
    --notes "$NOTES" \
    --draft \
    --prerelease \
    $FILES_ARG

log_info "✅ Test release v$VERSION created as draft!"
log_info "Review and publish at: https://github.com/wtbenica/text-clock/releases/tag/v$VERSION"