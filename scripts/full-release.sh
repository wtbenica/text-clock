#!/bin/bash

# SPDX-FileCopyrightText: 2025 2024 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Complete release script for text-clock GNOME Shell extension
# This script handles both GitHub release and AUR package update

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 [options] <bump-type>"
    echo ""
    echo "Bump types:"
    echo "  patch    Increment patch version (1.0.5 → 1.0.6)"
    echo "  minor    Increment minor version (1.0.5 → 1.1.0)"
    echo "  major    Increment major version (1.0.5 → 2.0.0)"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -n, --dry-run       Show what would be done without executing"
    echo "  --skip-aur          Skip AUR package update"
    echo "  --aur-auto-push     Automatically push AUR changes"
    echo ""
    echo "Examples:"
    echo "  $0 patch                    # Release new patch version"
    echo "  $0 minor                    # Release new minor version"
    echo "  $0 --dry-run patch         # Show what would happen"
    echo "  $0 --skip-aur minor        # Release but don't update AUR"
    echo ""
    echo "This script:"
    echo "  1. Bumps version using 'make bump-version TYPE=<type>'"
    echo "  2. Creates GitHub release using 'make release'"
    echo "  3. Updates AUR package (optional)"
    echo "  4. Pushes AUR changes (optional)"
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
SKIP_AUR=false
AUR_AUTO_PUSH=false
BUMP_TYPE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-aur)
            SKIP_AUR=true
            shift
            ;;
        --aur-auto-push)
            AUR_AUTO_PUSH=true
            shift
            ;;
        patch|minor|major)
            if [[ -z "$BUMP_TYPE" ]]; then
                BUMP_TYPE="$1"
            else
                log_error "Too many arguments"
                usage
            fi
            shift
            ;;
        -*)
            log_error "Unknown option: $1"
            usage
            ;;
        *)
            log_error "Invalid bump type: $1"
            usage
            ;;
    esac
done

if [[ -z "$BUMP_TYPE" ]]; then
    log_error "Bump type is required"
    usage
fi

# Check we're in the right directory
if [[ ! -f "Makefile" ]] || [[ ! -f "package.json" ]]; then
    log_error "This doesn't appear to be the text-clock project root"
    log_error "Please run from the directory containing Makefile and package.json"
    exit 1
fi

log_info "Starting complete release process with $BUMP_TYPE version bump"

if [[ "$DRY_RUN" == "true" ]]; then
    log_warn "DRY RUN MODE - No changes will be made"
fi

# Step 1: Bump version
log_step "Bumping $BUMP_TYPE version..."
if [[ "$DRY_RUN" == "true" ]]; then
    log_info "Would run: make bump-version TYPE=$BUMP_TYPE"
    NEW_VERSION="X.Y.Z"  # Can't determine without actually running
else
    make bump-version TYPE="$BUMP_TYPE"
    # Get the new version
    NEW_VERSION=$(node -p "JSON.parse(require('fs').readFileSync('version.json', 'utf8')).major + '.' + JSON.parse(require('fs').readFileSync('version.json', 'utf8')).minor + '.' + JSON.parse(require('fs').readFileSync('version.json', 'utf8')).patch")
    log_info "✓ Version bumped to $NEW_VERSION"
fi

# Step 2: Create GitHub release
log_step "Creating GitHub release..."
if [[ "$DRY_RUN" == "true" ]]; then
    log_info "Would run: make release"
else
    make release
    log_info "✓ GitHub release v$NEW_VERSION created"
fi

# Step 3: Update AUR (optional)
if [[ "$SKIP_AUR" == "true" ]]; then
    log_warn "Skipping AUR update"
else
    log_step "Updating AUR package..."
    
    AUR_SCRIPT="scripts/release-aur.sh"
    if [[ ! -f "$AUR_SCRIPT" ]]; then
        log_error "AUR release script not found: $AUR_SCRIPT"
        exit 1
    fi
    
    AUR_FLAGS=""
    if [[ "$DRY_RUN" == "true" ]]; then
        AUR_FLAGS="--dry-run"
    fi
    if [[ "$AUR_AUTO_PUSH" == "true" ]]; then
        AUR_FLAGS="$AUR_FLAGS --auto-push"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Would run: $AUR_SCRIPT $AUR_FLAGS $NEW_VERSION"
    else
        ./"$AUR_SCRIPT" $AUR_FLAGS "$NEW_VERSION"
    fi
fi

echo ""
log_info "🎉 Complete release process finished!"
if [[ "$DRY_RUN" == "false" ]]; then
    log_info "Released: text-clock v$NEW_VERSION"
    log_info "GitHub: https://github.com/wtbenica/text-clock/releases/tag/v$NEW_VERSION"
    if [[ "$SKIP_AUR" == "false" ]]; then
        log_info "AUR: https://aur.archlinux.org/packages/gnome-shell-extension-text-clock"
    fi
fi