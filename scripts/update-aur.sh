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
    log_error "Make sure you've run: make release-gh"
    exit 1
fi
log_info "✓ GitHub release v$VERSION exists"

# Update PKGBUILD in aur/ directory
log_step "Updating PKGBUILD in aur/ directory..."
UPDATE_CMD="$SCRIPT_DIR/update-pkgbuild.sh --version=$VERSION"
if [[ "$DRY_RUN" == true ]]; then
    UPDATE_CMD="$UPDATE_CMD --dry-run"
fi

if ! $UPDATE_CMD; then
    log_error "Failed to update PKGBUILD"
    exit 1
fi
log_info "✓ PKGBUILD updated"

# Sync to AUR repository
if [[ "$DRY_RUN" == false ]]; then
    log_step "Syncing to AUR repository..."
    
    SYNC_CMD="$SCRIPT_DIR/sync-to-aur.sh --update --version=$VERSION --commit"
    
    if [[ "$AUTO_PUSH" == true ]]; then
        SYNC_CMD="$SYNC_CMD --push --yes"
    fi
    
    if ! $SYNC_CMD; then
        log_error "Failed to sync to AUR repository"
        exit 1
    fi
    
    if [[ "$AUTO_PUSH" == true ]]; then
        log_info "✅ AUR package updated and pushed"
    else
        log_info "✅ AUR package updated and committed"
        log_info "To push: cd ~/Development/gnome-shell-extension-text-clock && git push"
    fi
else
    log_info "Would sync to AUR repository with: $SCRIPT_DIR/sync-to-aur.sh"
fi

log_info "✅ AUR update complete"