#!/bin/bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Create a GitHub release
# Usage: create-github-release.sh [--version X.Y.Z] [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
source "$SCRIPT_DIR/lib/common.sh"

VERSION=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)
            VERSION="$2"; shift 2 ;;
        --version=*)
            VERSION="${1#*=}"; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help)
            echo "Usage: $0 [--version X.Y.Z] [--dry-run]"
            echo "Create a GitHub release for the specified version"
            exit 0
            ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

if [[ -z "$VERSION" ]]; then
    VERSION="$(get_current_version)"
fi

log_info "Creating GitHub release for version $VERSION"

if [[ "$DRY_RUN" == true ]]; then
    log_warn "DRY RUN MODE - No release will be created"
    echo "Would run: git tag \"v$VERSION\""
    echo "Would run: git push origin \"v$VERSION\""
    exit 0
fi

ensure_main_branch
require_clean_worktree

# Create and push tag
log_step "Creating tag v$VERSION..."
git tag "v$VERSION" || {
    log_error "Failed to create tag v$VERSION"
    exit 1
}

log_step "Pushing tag to origin..."
git push origin "v$VERSION" || {
    log_error "Failed to push tag v$VERSION"
    exit 1
}

log_info "✅ Release tag v$VERSION pushed. GitHub Actions will create the release."
log_info "Check the release at: https://github.com/wtbenica/text-clock/releases/tag/v$VERSION"