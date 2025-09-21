#!/bin/bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Wait for GitHub PR status checks to pass
# Usage: wait-for-ci.sh [--timeout 300s|5m|1h]

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
source "$SCRIPT_DIR/lib/common.sh"

TIMEOUT="${PR_TIMEOUT:-3m}"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --timeout)
            TIMEOUT="$2"; shift 2 ;;
        --timeout=*)
            TIMEOUT="${1#*=}"; shift ;;
        -h|--help)
            echo "Usage: $0 [--timeout 300s|5m|1h]"
            echo "Wait for PR status checks to pass (timeout: ${TIMEOUT})"
            exit 0
            ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

require_gh_cli

# Validate timeout format
if ! [[ "$TIMEOUT" =~ ^[0-9]+[smh]$ ]]; then
    log_error "--timeout must include a unit suffix (s/m/h). Examples: 300s, 5m, 1h"
    exit 1
fi

current_branch="$(get_current_branch)"
log_info "Waiting for status checks to pass on branch: $current_branch (timeout=${TIMEOUT})"

# Get PR number
pr_number="$(gh pr list --head "$current_branch" --state open --json number --jq '.[0].number' 2>/dev/null || echo "")"
if [[ -z "$pr_number" || "$pr_number" == "null" ]]; then
    log_error "Could not determine PR number for branch $current_branch"
    exit 1
fi

log_info "Found PR #$pr_number"

# Use timeout command for cleaner implementation
if timeout --signal=TERM "$TIMEOUT" bash -c '
    while true; do
        status_rollup=$(gh pr view '"$pr_number"' --json statusCheckRollup --jq ".statusCheckRollup.state" 2>/dev/null || echo "")
        if [[ -n "$status_rollup" ]]; then
            case "$(echo "$status_rollup" | tr "[:upper:]" "[:lower:]")" in
                success)
                    echo "SUCCESS"
                    exit 0
                    ;;
                failure)
                    echo "FAILURE"
                    exit 1
                    ;;
                pending)
                    echo -n "."
                    ;;
                *)
                    echo -n "?"
                    ;;
            esac
        fi
        sleep 5
    done
'; then
    log_info "✅ All status checks passed"
else
    status="$?"
    if [[ "$status" == 124 ]]; then
        log_error "Status checks timed out after ${TIMEOUT}"
    else
        log_error "Status checks failed"
    fi
    exit 1
fi