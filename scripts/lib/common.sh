#!/bin/bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Common functions used across release scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Validation functions
require_clean_worktree() {
    if ! git diff-index --quiet HEAD --; then
        log_error "Working tree is not clean. Please commit or stash your changes."
        exit 1
    fi
}

require_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        log_error "$cmd is required but not found"
        exit 1
    fi
}

require_gh_cli() {
    require_command gh
}

require_node() {
    require_command node
}

# Version functions
get_current_version() {
    require_node
    node -pe "require('./package.json').version" 2>/dev/null || {
        log_error "Could not read version from package.json"
        exit 1
    }
}

get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

is_main_branch() {
    [[ "$(get_current_branch)" == "main" ]]
}

# Git operations
ensure_main_branch() {
    if ! is_main_branch; then
        log_error "You must be on the main branch. Currently on: $(get_current_branch)"
        exit 1
    fi
}

update_main_branch() {
    log_info "Updating main branch..."
    git fetch origin main >/dev/null 2>&1 || {
        log_error "Failed to fetch from origin"
        exit 1
    }
    if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
        log_error "Your main branch is not up to date with origin/main. Please pull the latest changes."
        exit 1
    fi
}

# Utility functions
confirm_action() {
    local prompt="$1"
    local default="${2:-n}"

    if [[ "${ACCEPT_ALL:-0}" == "1" ]]; then
        log_info "Auto-accepting due to ACCEPT_ALL=1"
        return 0
    fi

    local response
    read -p "$prompt [y/N] " response
    case "${response:-$default}" in
        [Yy]|[Yy][Ee][Ss]) return 0 ;;
        *) return 1 ;;
    esac
}

# Project root detection
get_project_root() {
    # Get the directory containing this script, then go up one level
    dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
}