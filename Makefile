# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Main Makefile - includes all component Makefiles
# This file provides the main entry points and includes specialized Makefiles

### === Variables ===
NAME=text-clock
DOMAIN=benica.dev
MO_FILES=$(wildcard po/*.mo)
ZIP_FILE=$(NAME)@${DOMAIN}-$(CURRENT_VERSION).zip
TS_FILES=$(wildcard *.ts) $(wildcard ui/*.ts) $(wildcard constants/**/*.ts) $(wildcard utils/*.ts)
DIST_DIR=dist
LOCALE_DIR=locale
GNOME_SHELL_EXT_DIR=$(HOME)/.local/share/gnome-shell/extensions

# Extract current version from package.json
CURRENT_VERSION := $(shell node -pe "require('./package.json').version")

#   ACCEPT_ALL=0 (default) - prompts will be shown for confirmation
#   ACCEPT_ALL=1           - prompts will be skipped (auto-accept)
ACCEPT_ALL ?= 0

# Default timeout for PR status watch operations. Must include unit suffix (s/m/h)
# Examples: 300s (seconds), 5m (minutes), 1h (hours)
PR_TIMEOUT ?= 3m

# Build configuration (shell flags, make behavior).
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DELETE_ON_ERROR:
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules

### === Help ===

# Help (standalone) - first public help entry, not part of a section
## help                Show this help text
help:
	@command -v awk >/dev/null 2>&1 || { echo "awk is required for make help"; exit 1; }
	@./scripts/help.awk $(MAKEFILE_LIST)


# Include all component Makefiles
include make/Makefile.build
include make/Makefile.test
include make/Makefile.release
include make/Makefile.aur
include make/Makefile.version


## check-deps          Verify required tools are available (yarn, node, glib-compile-schemas, zip, xgettext)
check-deps:
	@echo "Checking required tools..."
	@command -v yarn >/dev/null 2>&1 || { echo "ERROR: yarn is not installed or not on PATH. Install and retry."; exit 1; }
	@yarn_version=$$(yarn --version 2>/dev/null || echo "0") && \
	major=$$(echo $$yarn_version | sed -E 's/^([0-9]+).*/\1/') && \
	if [ -z "$$major" ] || [ $$major -lt 4 ]; then \
		echo "ERROR: Yarn v4 or later is required (found: $$yarn_version). Please install the recommended Yarn version."; exit 1; \
	fi
	@command -v node >/dev/null 2>&1 || { echo "ERROR: node is not installed or not on PATH."; exit 1; }
	@command -v perl >/dev/null 2>&1 || { echo "ERROR: perl is not installed or not on PATH."; exit 1; }
	@command -v glib-compile-schemas >/dev/null 2>&1 || { echo "ERROR: glib-compile-schemas is not installed or not on PATH."; exit 1; }
	@command -v zip >/dev/null 2>&1 || { echo "ERROR: zip is not installed or not on PATH."; exit 1; }
	@command -v xgettext >/dev/null 2>&1 || { echo "ERROR: xgettext (gettext) is not installed or not on PATH."; exit 1; }
	@yarn_version=$$(yarn --version 2>/dev/null || echo "0") && echo "check-deps: OK (yarn $$yarn_version)"

### === Functions ===

define copy_and_modify
	@cp $(1) $(2)
	$(foreach cmd,$(3),sed -i $(cmd) $(2) || { echo "Modifying $(2) failed"; exit 1; };)
endef

define check_gh_cli
	@command -v gh >/dev/null 2>&1 || { echo "ERROR: GitHub CLI (gh) is not installed. Please install it to create pull requests."; exit 1; }
endef

### === Phony Targets ===

.PHONY: check-deps help


