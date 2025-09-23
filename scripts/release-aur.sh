#!/bin/bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# AUR release script for text-clock GNOME Shell extension
# This script automates the AUR package update after a GitHub release
# 
# It performs the following steps:
# 1. Checks that the GitHub release exists
# 2. Updates AUR package files (PKGBUILD, .SRCINFO)
# 3. Tests the package builds correctly
# 4. Commits changes to AUR clone repository
# 5. Optionally pushes to AUR
# 6. Provides a summary and next steps
#
# CLI flags:
#   -h, --help          Show this help message
#   -n, --dry-run       Show what would be done without executing
#   -s, --skip-test     Skip the build test step
#   --auto-push         Automatically push to AUR (default: ask)
#
#   <version>          The version to release (format: X.Y.Z)
#
# Usage: scripts/release-aur.sh [options] <version>

set -euo pipefail

# Configuration
AUR_REPO_PATH="$HOME/Development/aur/gnome-shell-extension-text-clock"
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 [options] <version>"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -n, --dry-run       Show what would be done without executing"
    echo "  -s, --skip-test     Skip the build test step"
    echo "  --auto-push         Automatically push to AUR (default: ask)"
    echo ""
    echo "Examples:"
    echo "  $0 1.0.5                   # Update AUR to version 1.0.5"
    echo "  $0 --dry-run 1.0.5         # Show what would happen"
    echo "  $0 --auto-push 1.0.5       # Update and auto-push to AUR"
    echo ""
    echo "This script:"
    echo "  1. Checks that the GitHub release exists"
    echo "  2. Updates AUR package files (PKGBUILD, .SRCINFO)"
    echo "  3. Tests the package builds correctly"
    echo "  4. Commits changes to AUR repository"
    echo "  5. Optionally pushes to AUR"
    exit 1
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Parse arguments
DRY_RUN=false
SKIP_TEST=false
AUTO_PUSH=false
VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -s|--skip-test)
            SKIP_TEST=true
            shift
            ;;
        --auto-push)
            AUTO_PUSH=true
            shift
            ;;
        -*)
            log_error "Unknown option: $1"
            usage
            ;;
        *)
            if [[ -z "$VERSION" ]]; then
                VERSION="$1"
            else
                log_error "Too many arguments"
                usage
            fi
            shift
            ;;
    esac
done

if [[ -z "$VERSION" ]]; then
    log_error "Version is required"
    usage
fi

# Validate version format
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    log_error "Invalid version format. Expected: X.Y.Z"
    exit 1
fi

log_info "Starting AUR release process for version $VERSION"

if [[ "$DRY_RUN" == "true" ]]; then
    log_warn "DRY RUN MODE - No changes will be made"
fi

# Step 1: Check AUR repository exists
log_step "Checking AUR repository..."
if [[ ! -d "$AUR_REPO_PATH" ]]; then
    log_error "AUR repository not found at: $AUR_REPO_PATH"
    log_error "Please clone it first:"
    log_error "  git clone ssh://aur@aur.archlinux.org/gnome-shell-extension-text-clock.git $AUR_REPO_PATH"
    exit 1
fi

# Step 2: Check GitHub release exists
log_step "Verifying GitHub release v$VERSION exists..."
RELEASE_URL="https://github.com/wtbenica/text-clock/releases/download/v${VERSION}/text-clock@benica.dev.zip"
if ! curl -sSf "$RELEASE_URL" -o /dev/null; then
    log_error "GitHub release v$VERSION not found"
    log_error "Make sure you've run: make release"
    exit 1
fi
log_info "✓ GitHub release v$VERSION exists"

# Step 3: Update AUR package files
log_step "Updating AUR package files..."
if [[ "$DRY_RUN" == "true" ]]; then
    log_info "Would run: $AUR_REPO_PATH/../update-aur.sh $VERSION"
else
    cd "$AUR_REPO_PATH"
    if [[ -f "../update-aur.sh" ]]; then
        if [[ -n "${GPG_PUBKEY:-}" ]]; then
            GPG_PUBKEY="$GPG_PUBKEY" ../update-aur.sh "$VERSION"
        else
            ../update-aur.sh "$VERSION"
        fi
    else
        log_error "update-aur.sh not found. Please copy it to the AUR repo directory."
        exit 1
    fi
fi

# Step 4: Test build
if [[ "$SKIP_TEST" == "false" ]]; then
    log_step "Testing package build..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Would run: makepkg --nobuild --nodeps"
    else
        cd "$AUR_REPO_PATH"
        makepkg --nobuild --nodeps
        log_info "✓ Package build test passed"
    fi
else
    log_warn "Skipping build test"
fi

# Step 5: Commit changes
log_step "Committing changes..."
if [[ "$DRY_RUN" == "true" ]]; then
    log_info "Would run: git add PKGBUILD .SRCINFO"
    log_info "Would run: git commit -m 'Update to v$VERSION'"
else
    cd "$AUR_REPO_PATH"
    git add PKGBUILD .SRCINFO
    if git diff --cached --quiet; then
        log_warn "No changes to commit"
    else
        git commit -m "Update to v$VERSION"
        log_info "✓ Changes committed"
    fi
fi

# Step 6: Push to AUR
log_step "Publishing to AUR..."
if [[ "$DRY_RUN" == "true" ]]; then
    log_info "Would ask about pushing to AUR"
elif [[ "$AUTO_PUSH" == "true" ]]; then
    cd "$AUR_REPO_PATH"
    git push
    log_info "✓ Pushed to AUR"
else
    echo -e "${YELLOW}Push to AUR? [y/N]${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cd "$AUR_REPO_PATH"
        git push
        log_info "✓ Pushed to AUR"
    else
        log_info "Skipped pushing to AUR"
        log_info "To push later: cd $AUR_REPO_PATH && git push"
    fi
fi

echo ""
log_info "AUR release process complete!"
log_info "Package: gnome-shell-extension-text-clock v$VERSION"
if [[ "$DRY_RUN" == "false" ]]; then
    log_info "Users can now install with: yay -S gnome-shell-extension-text-clock"
fi