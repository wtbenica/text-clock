#!/bin/bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Create a PR from current branch to main
# Usage: create-pr.sh [--draft]

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
source "$SCRIPT_DIR/lib/common.sh"

DRAFT=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --draft) DRAFT=true; shift ;;
        -h|--help)
            echo "Usage: $0 [--draft]"
            echo "Create a PR from current branch to main"
            exit 0
            ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

require_gh_cli
require_clean_worktree

current_branch="$(get_current_branch)"
if [[ "$current_branch" == "main" ]]; then
    log_error "You're on main branch. Create a feature branch first."
    exit 1
fi

version="$(get_current_version)"
log_info "Creating PR from branch: $current_branch (version: $version)"

draft_flag=""
if [[ "$DRAFT" == true ]]; then
    draft_flag="--draft"
    log_info "Creating draft PR"
fi

pr_output="$(gh pr create --base main --head "$current_branch" --title "Release v$version" --body "Automated release PR for version $version" --fill $draft_flag 2>&1)"

pr_url="$(echo "$pr_output" | grep -Eo 'https://github.com/[^ ]+/pull/[0-9]+' || true)"
if [[ -z "$pr_url" ]]; then
    log_error "Failed to create PR. Output:"
    echo "$pr_output"
    exit 1
fi

log_info "✅ PR created: $pr_url"