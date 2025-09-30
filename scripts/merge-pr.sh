#!/bin/bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Merge the current branch's PR
# Usage: merge-pr.sh

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
source "$SCRIPT_DIR/lib/common.sh"

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            echo "Usage: $0"
            echo "Merge the current branch's open PR"
            exit 0
            ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

require_gh_cli

current_branch="$(get_current_branch)"
log_info "Merging PR for branch: $current_branch"

# Get PR number
pr_number="$(gh pr list --head "$current_branch" --state open --json number --jq '.[0].number' 2>/dev/null || echo "")"
if [[ -z "$pr_number" || "$pr_number" == "null" ]]; then
    log_error "Could not determine PR number for branch $current_branch"
    exit 1
fi

log_info "Found PR #$pr_number"

# Check if PR is ready for merge
pr_status="$(gh pr view "$pr_number" --json isDraft --jq '.isDraft')"
if [[ "$pr_status" == "true" ]]; then
    log_error "PR #$pr_number is still a draft. Promote it first with: make promote-pr"
    exit 1
fi

log_step "Merging PR #$pr_number..."
gh pr merge --auto --squash || {
    log_error "Failed to merge PR"
    exit 1
}

log_info "✅ PR merged successfully"