#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -euo pipefail

# Wait for GitHub PR status checks to pass and merge the PR.
# Usage: pr-wait-and-merge.sh [--timeout 300s|5m|1h]
# TIMEOUT must include a unit suffix: s (seconds), m (minutes), or h (hours).

TIMEOUT=3m
while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout)
      TIMEOUT="$2"; shift 2;;
    --timeout=*)
      TIMEOUT="${1#*=}"; shift;;
    -h|--help)
      echo "Usage: $0 [--timeout 300s|5m|1h]"; exit 0;;
    *)
      echo "Unknown arg: $1"; exit 2;;
  esac
done

command -v gh >/dev/null 2>&1 || { echo "ERROR: gh (GitHub CLI) not found"; exit 2; }

# Validate TIMEOUT contains an explicit unit (s/m/h)
if ! [[ "$TIMEOUT" =~ ^[0-9]+[smh]$ ]]; then
  echo "ERROR: --timeout must include a unit suffix (s/m/h). Examples: 300s, 5m, 1h";
  exit 2;
fi

echo "Waiting for status checks to pass (timeout=${TIMEOUT})..."

# Determine PR number for the current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
pr_number=$(gh pr list --head "$current_branch" --state open --json number --jq '.[0].number' 2>/dev/null || echo "")
if [ -z "$pr_number" ] || [ "$pr_number" = "null" ]; then
  echo "ERROR: Could not determine PR number for branch $current_branch"; exit 1;
fi

# Convert timeout to seconds for internal polling
unit=${TIMEOUT: -1}
value=${TIMEOUT%?}
case "$unit" in
  s) max_seconds=$((value));;
  m) max_seconds=$((value * 60));;
  h) max_seconds=$((value * 3600));;
  *) echo "ERROR: Unsupported time unit: $unit"; exit 2;;
esac

interval=5
elapsed=0
echo "Polling PR #$pr_number status every ${interval}s (timeout ${max_seconds}s) using 'gh pr view --json statusCheckRollup'"
while [ $elapsed -lt $max_seconds ]; do
  # Query PR status rollup which contains checks summary per gh docs
  status_rollup=$(gh pr view "$pr_number" --json statusCheckRollup --jq '.statusCheckRollup.state' 2>/dev/null || echo "")
  # status_rollup is expected to be 'SUCCESS', 'PENDING', or 'FAILURE' (case may vary)
  if [ -n "$status_rollup" ]; then
    case "$(echo "$status_rollup" | tr '[:upper:]' '[:lower:]')" in
      success)
        echo "✅ All status checks passed"; break;;
      failure)
        echo "ERROR: One or more checks failed"; exit 1;;
      pending)
        # continue waiting
        ;;
      *)
        # Unknown state, continue polling
        ;;
    esac
  fi

  sleep $interval
  elapsed=$((elapsed + interval))
  echo "  ...waiting ($elapsed/$max_seconds)s"
done

if [ $elapsed -ge $max_seconds ]; then
  echo "ERROR: Status checks failed or timed out"; exit 1;
fi

echo "Merging PR..."
gh pr merge --auto --squash || { echo "ERROR: Failed to merge PR"; exit 1; }
echo "✅ PR merged successfully"
