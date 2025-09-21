#!/bin/bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Update AUR package for current GitHub release
# Usage: update-aur.sh [--version X.Y.Z] [--dry-run] [--auto-push]

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
source "$SCRIPT_DIR/lib/common.sh"

VERSION=""
DRY_RUN=false
AUTO_PUSH=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)
            VERSION="$2"; shift 2 ;;
        --version=*)
            VERSION="${1#*=}"; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        --auto-push) AUTO_PUSH=true; shift ;;
        -h|--help)
            echo "Usage: $0 [--version X.Y.Z] [--dry-run] [--auto-push]"
            echo "Update AUR package for the specified version"
            exit 0
            ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

if [[ -z "$VERSION" ]]; then
    VERSION="$(get_current_version)"
fi

log_info "Updating AUR package for version $VERSION"

if [[ "$DRY_RUN" == true ]]; then
    log_warn "DRY RUN MODE - No AUR changes will be made"
fi

# Check GitHub release exists
log_step "Verifying GitHub release v$VERSION exists..."
RELEASE_URL="https://github.com/wtbenica/text-clock/releases/download/v${VERSION}/text-clock@benica.dev.zip"
if ! curl -sSf "$RELEASE_URL" -o /dev/null; then
    log_error "GitHub release v$VERSION not found"
    log_error "Make sure you've run: make release-github"
    exit 1
fi
log_info "✓ GitHub release v$VERSION exists"

# Update AUR package files
log_step "Updating AUR package files..."
if [[ "$DRY_RUN" == true ]]; then
    log_info "Would run: ./scripts/release-aur.sh --dry-run $VERSION"
else
    ./scripts/release-aur.sh --dry-run "$VERSION" || {
        log_error "AUR package update failed"
        exit 1
    }
fi

# Commit and push
if [[ "$DRY_RUN" == false ]]; then
    log_step "Committing AUR changes..."
    ./scripts/release-aur.sh "$VERSION" || {
        log_error "Failed to commit AUR changes"
        exit 1
    }

    if [[ "$AUTO_PUSH" == true ]] || confirm_action "Push AUR changes to remote?"; then
        log_step "Pushing to AUR..."
        ./scripts/release-aur.sh --auto-push "$VERSION" || {
            log_error "Failed to push AUR changes"
            exit 1
        }
        log_info "✅ AUR package updated and pushed"
    else
        log_info "AUR changes committed but not pushed"
        log_info "Push later with: ./scripts/release-aur.sh --auto-push $VERSION"
    fi
fi

log_info "✅ AUR update complete"