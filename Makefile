# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Header Section: variable definitions and paths used by targets
## === Variables ===
NAME=text-clock
DOMAIN=benica.dev
MO_FILES=$(wildcard po/*.mo)
ZIP_FILE=$(NAME)@${DOMAIN}.zip
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

# ########################
# Function Definitions
# ########################
## === Functions ===

define copy_and_modify
	@cp $(1) $(2)
	$(foreach cmd,$(3),sed -i $(cmd) $(2) || { echo "Modifying $(2) failed"; exit 1; };)
endef

define check_gh_cli
	@command -v gh >/dev/null 2>&1 || { echo "ERROR: GitHub CLI (gh) is not installed. Please install it to create pull requests."; exit 1; }
endef

## === Phony Targets ===
## (List of phony targets used below)
##

.PHONY: \
	all \
	pack \
	install install-system uninstall uninstall-system \
	pot create_ext_dir clean \
	test validate compile build check-deps \
	release release-auto \
	release-aur release-aur-auto \
	release-full release-full-auto release-existing release-dry release-aur-dry \
	bump-version draft-pr promote-pr pr_wait_and_merge ci-dry-run help

# ################################
## === Main Build Targets ===
## Notes:
# - `make`/`make all` runs the `validate` target (lint + tests + build).
# - `compile` compiles TypeScript into `dist/` using `tsc`.
# - `build` prepares the `dist/` directory for distribution
# - `pack` zips the `dist/` folder for distribution as a GNOME Shell
#   extension.
# - `install` installs to user directory (~/.local/share/gnome-shell/extensions)
# - `install-system` installs system-wide (/usr/share/gnome-shell/extensions) - requires sudo
# - Release targets (`release`, `release-aur`, `release-full`) prompt for confirmation
#   unless ACCEPT_ALL=1 is set: `make release ACCEPT_ALL=1`
# - Auto versions (`release-auto`, `release-aur-auto`, `release-full-auto`) skip prompts
# ################################

# Default target - run validation pipeline (lint, tests, build)
## all                 Run full validation (lint, tests, build)
all: validate

# Check required external tools and environment
# Verifies yarn, node, perl, glib-compile-schemas, zip, and xgettext

## check-deps          Verify required external tools are available (yarn, node, glib-compile-schemas, zip, xgettext)
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

# Compile TypeScript to `dist/` (invokes `tsc -p config/tsconfig.json`)
## compile             Compile TypeScript into $(DIST_DIR)
compile: $(DIST_DIR)/extension.js

# Prepare the `dist/` directory for distribution
# Puts all required files (compiled JS, metadata, schemas, locale) into `dist/`.

## build               Prepare $(DIST_DIR) for distribution (copy metadata, schemas, locale)
build: $(DIST_DIR)/extension.js schemas/gschemas.compiled locale/
	@echo "Building distribution package..."
	@mkdir -p $(DIST_DIR)
	@cp -r schemas $(DIST_DIR)/ 2>/dev/null || true
	@cp metadata.json $(DIST_DIR)/ 2>/dev/null || true
	@cp -r $(LOCALE_DIR) $(DIST_DIR)/ 2>/dev/null || true
	@echo "Distribution package ready in $(DIST_DIR)/"

# Package the extension into a zip file (zips the contents of `dist/`)
## pack                Create the distribution zip file
pack: build ${ZIP_FILE}

# Generate a new POT file (collects translatable strings from compiled JS)
pot: po/${NAME}@${DOMAIN}.pot

# Install the extension into the local GNOME Shell extensions directory
install: create_ext_dir build
	@echo "Installing the extension..."
	@rm -rf $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN) || { echo "Removing existing extension failed"; exit 1; }
	@cp -R $(DIST_DIR) $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN) || { echo "Copying extension failed"; exit 1; }
	@echo "Installation complete."

# Install the extension system-wide (requires sudo)
install-system: build
	@echo "Installing the extension system-wide..."
	@if [ "$$EUID" -ne 0 ]; then \
		echo "System-wide installation requires root privileges."; \
		echo "Please run: sudo make install-system"; \
		exit 1; \
	fi
	@SYSTEM_EXT_DIR="/usr/share/gnome-shell/extensions"; \
	mkdir -p "$$SYSTEM_EXT_DIR" || { echo "Creating system extension directory failed"; exit 1; }; \
	rm -rf "$$SYSTEM_EXT_DIR/$(NAME)@$(DOMAIN)" || { echo "Removing existing system extension failed"; exit 1; }; \
	cp -R $(DIST_DIR) "$$SYSTEM_EXT_DIR/$(NAME)@$(DOMAIN)" || { echo "Copying extension to system directory failed"; exit 1; }; \
	find "$$SYSTEM_EXT_DIR/$(NAME)@$(DOMAIN)" -type f -exec chmod 644 {} \; || { echo "Setting file permissions failed"; exit 1; }; \
	find "$$SYSTEM_EXT_DIR/$(NAME)@$(DOMAIN)" -type d -exec chmod 755 {} \; || { echo "Setting directory permissions failed"; exit 1; }
	@echo "System-wide installation complete."
	@echo "The extension is now available to all users on this system."

# Uninstall the extension from the local GNOME Shell extensions directory
uninstall:
	@echo "Uninstalling the extension from user directory..."
	@if [ -d "$(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN)" ]; then \
		rm -rf "$(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN)" || { echo "Removing extension failed"; exit 1; }; \
		echo "Extension uninstalled from user directory."; \
	else \
		echo "Extension not found in user directory."; \
	fi

# Uninstall the extension from the system directory (requires sudo)
uninstall-system:
	@echo "Uninstalling the extension from system directory..."
	@if [ "$$EUID" -ne 0 ]; then \
		echo "System-wide uninstallation requires root privileges."; \
		echo "Please run: sudo make uninstall-system"; \
		exit 1; \
	fi
	@SYSTEM_EXT_DIR="/usr/share/gnome-shell/extensions"; \
	if [ -d "$$SYSTEM_EXT_DIR/$(NAME)@$(DOMAIN)" ]; then \
		rm -rf "$$SYSTEM_EXT_DIR/$(NAME)@$(DOMAIN)" || { echo "Removing system extension failed"; exit 1; }; \
		echo "Extension uninstalled from system directory."; \
	else \
		echo "Extension not found in system directory."; \
	fi

# ################################
# Helper Targets
# ################################

# Update the zip file if any of the source files have changed
${ZIP_FILE}: metadata.json node_modules/ $(DIST_DIR)/extension.js schemas/gschemas.compiled locale/
	@echo "Packaging the extension..."
	cp -r schemas $(DIST_DIR)/ || { echo "Copying schemas failed"; exit 1; }
	cp metadata.json $(DIST_DIR)/ || { echo "Copying metadata.json failed"; exit 1; }
	cp -r $(LOCALE_DIR) $(DIST_DIR)/ || { echo "Copying locale directory failed"; exit 1; }
	(cd $(DIST_DIR) && zip ../${ZIP_FILE} -9r .) || { echo "Zipping extension failed"; exit 1; }

# Ensure the local GNOME Shell extensions directory exists
create_ext_dir:
	@echo "Ensuring GNOME Shell extensions directory exists..."
	@mkdir -p $(GNOME_SHELL_EXT_DIR) || { echo "Creating GNOME Shell extensions directory failed"; exit 1; }

# Compile TypeScript files
$(DIST_DIR)/extension.js: $(TS_FILES) node_modules/
	@echo "Compiling TypeScript files..."
	@command -v yarn >/dev/null 2>&1 || { echo "ERROR: yarn is required for building; please install and try again."; exit 1; }
	@yarn tsc -p config/tsconfig.json || { echo "TypeScript compilation failed"; exit 1; }

# Ensure node modules are installed based on package.json before proceeding
node_modules/: package.json
		@echo "Installing node modules..."
		@command -v yarn >/dev/null 2>&1 || { echo "ERROR: yarn is required to install dependencies; please install and try again."; exit 1; }
		@yarn install --immutable || { echo "yarn install failed"; exit 1; }

# Compile GSettings schemas
schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	@echo "Compiling GSettings schemas..."
	glib-compile-schemas schemas || { echo "GSettings schema compilation failed"; exit 1; }

# Prepare locale directory
locale/: $(MO_FILES)
	@echo "Preparing locale..."
	@mkdir -p $(LOCALE_DIR) || { echo "Creating locale directory failed"; exit 1; }
	@for file in $(MO_FILES); do \
		lang=$$(basename $$file .mo); \
		mkdir -p $(LOCALE_DIR)/$$lang/LC_MESSAGES || { echo "Creating message directory for $$lang failed"; exit 1; }; \
		cp $$file $(LOCALE_DIR)/$$lang/LC_MESSAGES/$(NAME)@$(DOMAIN).mo || { echo "Copying $$file failed"; exit 1; }; \
	done

# Generate a new POT file
po/text-clock@benica.dev.pot: dist/constants/dates/extension.js dist/constants/times/extension.js
	@echo "Generating a new POT file..."
	@command -v yarn >/dev/null 2>&1 || { echo "ERROR: yarn is required to generate POT files; please install and try again."; exit 1; }
	@yarn tsc -p config/tsconfig.pot.json || { echo "TypeScript compilation failed"; exit 1; }
	xgettext --from-code=UTF-8 --keyword=_ --output=po/text-clock@benica.dev.pot dist/constants_*_extension.js || { echo "Generating POT file failed"; exit 1; }


## === Testing ===

# Run tests (comprehensive)

## test                Run TypeScript tests and unit/integration suites
test: node_modules/
	@echo "Running tests..."
	@command -v yarn >/dev/null 2>&1 || { echo "ERROR: yarn is required to run tests; please install and try again."; exit 1; }
	@yarn tsc -p config/tsconfig.test.json || { echo "TypeScript compilation failed"; exit 1; }
	@yarn test || { echo "yarn test failed"; exit 1; }

# Validate the entire project

## validate            Run build and tests (used as the default CI-style check)
validate: build test
	@echo "Validation complete - all checks passed!"

################################
# Clean 
################################

# Clean up the project directory
clean:
	@echo "Cleaning up..."
	@rm -rf $(DIST_DIR) || { echo "Removing dist directory failed"; exit 1; }
	@rm -rf node_modules/ || { echo "Removing node_modules directory failed"; exit 1; }
	@rm -f ${ZIP_FILE} || { echo "Removing zip file failed"; exit 1; }
	@rm -rf $(LOCALE_DIR) || { echo "Removing locale directory failed"; exit 1; }
	@rm -f schemas/gschemas.compiled || { echo "Removing compiled GSettings schemas failed"; exit 1; }
	@rm -f yarn.lock || { echo "Removing yarn.lock file failed"; exit 1; }
	@echo "Cleaning up complete."

################################
# Release and Version Management
################################

# Help target to improve discoverability of common commands
## === Help ===
## help                Show this help text
help:
	@awk 'BEGIN{section="Other";oc=0; ignore="^(Variables|Functions|Phony Targets|Help|Header Section)$$"} /^[ \t]*## ===/ { s=$$0; sub(/^[ \t]*## ===[ \t]*/,"",s); sub(/[ \t]*===[ \t]*$$/,"",s); gsub(/^[ \t]+|[ \t]+$$/,"",s); if (s ~ ignore) { section="Other"; next } if(!(s in seen)){seen[s]=1; order[++oc]=s}; section=s; next } /^##[ \t]+[^=]/{ desc=substr($$0,4); gsub(/^[ \t]+|[ \t]+$$/,"",desc); if(getline){ if(match($$0,/^[ \t]*([A-Za-z0-9_][A-Za-z0-9_.-]*):/,m)){ target=m[1]; entries_count[section]++; entries[section SUBSEP entries_count[section]] = target ":::" desc } } } END{ if(order[1]=="") { order[++oc]="Other" } for(i=1;i<=oc;i++){ s=order[i]; print ""; print s ":"; for(k=1;k<=entries_count[s];k++){ split(entries[s SUBSEP k],p,":::"); printf("  %-20s %s\n", p[1], p[2]) } } if(entries_count["Other"]) { print ""; print "Other:"; for(k=1;k<=entries_count["Other"];k++){ split(entries["Other" SUBSEP k],p,":::"); printf("  %-20s %s\n", p[1], p[2]) } } }' $(MAKEFILE_LIST)



## === Release ===
## release             Create and push git tag for current version (interactive)
release: check-deps
	@echo "Delegating release to scripts/release.sh"
	@if [ "$(ACCEPT_ALL)" = "1" ]; then \
		./scripts/release.sh --auto --version $(CURRENT_VERSION); \
	else \
		./scripts/release.sh --version $(CURRENT_VERSION); \
	fi

## bump-version        Bump version (TYPE=patch|minor|major) and create a development branch
bump-version: check-deps
	@if [ -z "$(TYPE)" ]; then \
		echo "ERROR: TYPE parameter is required. Usage: make bump-version TYPE=patch|minor|major"; \
		exit 1; \
	fi
	@if [ "$(TYPE)" != "patch" ] && [ "$(TYPE)" != "minor" ] && [ "$(TYPE)" != "major" ]; then \
		echo "ERROR: TYPE must be patch, minor, or major. Got: $(TYPE)"; \
		exit 1; \
	fi
	@echo "Starting version bump process ($(TYPE))..."
	@# Verify we're on main branch
	@current_branch=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$current_branch" != "main" ]; then \
		echo "ERROR: You must be on the main branch to bump version. Currently on: $$current_branch"; \
		exit 1; \
	fi
	@# Verify working tree is clean
	@if ! git diff-index --quiet HEAD --; then \
		echo "ERROR: Working tree is not clean. Please commit or stash your changes."; \
		exit 1; \
	fi
	@# Verify we're up to date with remote
	@git fetch origin main >/dev/null 2>&1 || { echo "ERROR: Failed to fetch from origin"; exit 1; }
	@if [ "$$(git rev-parse HEAD)" != "$$(git rev-parse origin/main)" ]; then \
		echo "ERROR: Your main branch is not up to date with origin/main. Please pull the latest changes."; \
		exit 1; \
	fi
	@# Check if GitHub CLI is available
	@command -v gh >/dev/null 2>&1 || { echo "ERROR: GitHub CLI (gh) is not installed. Please install it to create pull requests."; exit 1; }
	@# Get current and new version
	@echo "Current version: $(CURRENT_VERSION)"; \
	new_version=$$(node scripts/bump-version.cjs $(TYPE) --dry-run | grep "New version:" | cut -d' ' -f3 2>/dev/null || echo ""); \
	if [ -z "$$new_version" ]; then \
		echo "ERROR: Failed to calculate new version"; \
		exit 1; \
	fi; \
	echo "Target version: $$new_version"; \
	branch_name="v$$new_version"; \
	echo "Creating development branch: $$branch_name"; \
	git checkout -b "$$branch_name" || { echo "ERROR: Failed to create branch $$branch_name"; exit 1; }; \
	echo "Updating version numbers..."; \
	node scripts/bump-version.cjs $(TYPE) || { echo "ERROR: Version bump script failed"; exit 1; }; \
	git add version.json package.json metadata.json README.md || { echo "ERROR: Failed to stage files"; exit 1; }; \
	git commit -m "Bump version to $$new_version" || { echo "ERROR: Failed to commit changes"; exit 1; }; \
	echo "✅ Version bump complete!"; \
	echo "   Now on development branch: $$branch_name"; \
	echo "   All version numbers updated to $$new_version"; \
	echo "   Ready to start development for the next release"; \
	echo ""; \
	echo "When ready to merge back to main:"; \
	echo "   git push origin $$branch_name"; \
	echo "   gh pr create --base main --head $$branch_name"

## release-aur         Update AUR package for current GitHub release (interactive)
release-aur:
	@echo "Updating AUR package..."
	@if [ ! -f scripts/release-aur.sh ]; then \
		echo "ERROR: scripts/release-aur.sh not found"; \
		exit 1; \
	fi
	@echo ""; \
	echo "This will:"; \
	echo "  1. Verify GitHub release v$(CURRENT_VERSION) exists"; \
	echo "  2. Update AUR package files (PKGBUILD, .SRCINFO)"; \
	echo "  3. Test package build"; \
	echo "  4. Commit changes to AUR repository"; \
	echo "  5. Optionally push to AUR"; \
	echo ""; \
	if [ "$(ACCEPT_ALL)" != "1" ]; then \
		read -p "Continue with AUR release for v$(CURRENT_VERSION)? [y/N] " confirm; \
		if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
			echo "AUR release cancelled."; \
			exit 0; \
		fi; \
	else \
		echo "Auto-accepting due to ACCEPT_ALL=1"; \
	fi; \
	echo "Releasing AUR package for version $(CURRENT_VERSION)"; \
	if [ "$(ACCEPT_ALL)" = "1" ]; then \
		./scripts/release-aur.sh --auto-push "$(CURRENT_VERSION)"; \
	else \
		./scripts/release-aur.sh "$(CURRENT_VERSION)"; \
	fi

## release-full        Create PR from current branch, wait for checks, merge, create release, update AUR
release-full:
	@echo "Starting complete release process from development branch..."
	$(call check_gh_cli)
	@# Verify working tree is clean
	@if ! git diff-index --quiet HEAD --; then \
		echo "ERROR: Working tree is not clean. Please commit or stash your changes."; \
		exit 1; \
	fi
	@# Get current branch and version info
	@current_branch=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$current_branch" = "main" ]; then \
		echo "ERROR: You're on main branch. This command should be run from a development branch."; \
		echo "Use 'make release' and 'make release-aur' instead for releases from main."; \
		exit 1; \
	fi; \
	if [ -z "$(CURRENT_VERSION)" ]; then \
		echo "ERROR: Could not read version from package.json. Aborting release."; \
		exit 1; \
	fi; \
	echo "Creating release from branch: $$current_branch"; \
	echo "Version: $(CURRENT_VERSION)"; \
	echo ""; \
	echo "This will:"; \
	echo "  1. Create PR from $$current_branch to main"; \
	echo "  2. Wait for GitHub Actions validation to pass"; \
	echo "  3. Auto-merge PR when validation succeeds"; \
	echo "  4. Create GitHub release"; \
	echo "  5. Update AUR package"; \
	echo ""; \
	if [ "$(ACCEPT_ALL)" != "1" ]; then \
		read -p "Continue? [y/N] " confirm; \
		if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
			echo "Release cancelled."; \
			exit 0; \
		fi; \
	else \
		echo "Auto-accepting due to ACCEPT_ALL=1"; \
	fi; \
	echo "Creating PR..."; \
	pr_output=$$(gh pr create --base main --head "$$current_branch" --title "Release v$(CURRENT_VERSION)" --body "Automated release PR for version $(CURRENT_VERSION)" --fill 2>&1); \
		pr_url=$$(echo "$$pr_output" | grep -Eo 'https://github.com/[^ ]+/pull/[0-9]+'); \
		if [ -z "$$pr_url" ]; then \
			echo "ERROR: Failed to create PR. Output:"; \
			echo "$$pr_output"; \
			exit 1; \
		fi; \
		echo "✅ PR created: $$pr_url"; \
		# Wait for checks and merge using common helper
		$(MAKE) pr_wait_and_merge || { echo "ERROR: PR validation/merge failed"; exit 1; }; \
	echo "Switching to main branch for releases..."; \
	git checkout main && git pull origin main || { echo "ERROR: Failed to update main branch"; exit 1; }; \
	echo "Creating GitHub release..."; \
	$(MAKE) release ACCEPT_ALL=1 || { echo "ERROR: GitHub release failed"; exit 1; }; \
	echo "Updating AUR package..."; \
	$(MAKE) release-aur ACCEPT_ALL=1 || { echo "ERROR: AUR update failed"; exit 1; }; \
	echo ""; \
	echo "🎉 Complete release process finished!"; \
	echo "✅ Version $(CURRENT_VERSION) released on GitHub"; \
	echo "✅ AUR package updated"; \
	echo ""; \
	echo "Next steps:"; \
	echo "  1. Submit to extensions.gnome.org: make pack"; \
	echo "  2. Start next development: make bump-version TYPE=patch"

# Auto-accepting versions of release targets (no prompts)
release-auto:
	$(MAKE) release ACCEPT_ALL=1

release-aur-auto:
	$(MAKE) release-aur ACCEPT_ALL=1

release-full-auto:
	$(MAKE) release-full ACCEPT_ALL=1

## release-dry         Run a non-destructive release simulation (dry-run)
release-dry:
	@echo "Running non-destructive release dry-run for version $(CURRENT_VERSION)"
	@if [ "$(ACCEPT_ALL)" = "1" ]; then \
		./scripts/release.sh --auto --dry-run --version $(CURRENT_VERSION); \
	else \
		./scripts/release.sh --dry-run --version $(CURRENT_VERSION); \
	fi

## ci-dry-run          Run validation + non-destructive release in auto mode (CI dry-run)
ci-dry-run: check-deps
	@echo "Starting CI dry-run: validate + non-destructive release"
	@$(MAKE) node_modules/ || { echo "ERROR: node_modules install failed"; exit 1; }
	@$(MAKE) validate || { echo "ERROR: validate failed"; exit 1; }
	@$(MAKE) release-dry ACCEPT_ALL=1 || { echo "ERROR: release-dry failed"; exit 1; }

## release-aur-dry     Non-destructive AUR release simulation for current version
release-aur-dry:
	@echo "Running non-destructive AUR release dry-run for version $(CURRENT_VERSION)"
	@if [ "$(ACCEPT_ALL)" = "1" ]; then \
		./scripts/release-aur.sh --dry-run "$(CURRENT_VERSION)"; \
	else \
		./scripts/release-aur.sh --dry-run "$(CURRENT_VERSION)"; \
	fi

## draft-pr            Create a draft PR for testing workflow timing
##                    (promote with `make promote-pr`)
draft-pr:
	@echo "Creating draft PR for testing..."
	$(call check_gh_cli)
	@# Get current branch info
	@current_branch=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$current_branch" = "main" ]; then \
		echo "ERROR: You're on main branch. Create a feature branch first."; \
		exit 1; \
	fi; \
	current_version=$$(node -pe "require('./package.json').version" 2>/dev/null || echo "unknown"); \
	echo "Creating draft PR from branch: $$current_branch"; \
	echo ""; \
	read -p "Enter PR title (default: 'Draft: $$current_branch'): " title; \
	if [ -z "$$title" ]; then \
		title="Draft: $$current_branch"; \
	fi; \
	read -p "Enter PR description (default: 'Draft PR for testing validation'): " body; \
	if [ -z "$$body" ]; then \
		body="Draft PR for testing validation and workflow timing"; \
	fi; \
	echo "Creating draft PR..."; \
	pr_output=$$(gh pr create --base main --head "$$current_branch" --title "$$title" --body "$$body" --draft 2>&1); \
	pr_url=$$(echo "$$pr_output" | grep -Eo 'https://github.com/[^ ]+/pull/[0-9]+'); \
	if [ -z "$$pr_url" ]; then \
		echo "ERROR: Failed to create draft PR. Output:"; \
		echo "$$pr_output"; \
		exit 1; \
	fi; \
	echo "✅ Draft PR created: $$pr_url"; \
	echo ""; \
	echo "This will trigger GitHub Actions validation."; \
	echo "You can watch the progress at: $$pr_url"; \
	echo ""; \
	echo "To check timing: gh run list"; \
	echo "To view detailed run: gh run view [run-id]"; \
	echo ""; \
	echo "To promote to ready for review: make promote-pr"; \
	echo "To release using this PR: make release-existing"

## promote-pr          Promote current branch's draft PR to ready for review
promote-pr:
	@echo "Promoting draft PR to ready for review..."
	$(call check_gh_cli)
	@# Get current branch and find associated PR
	@current_branch=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$current_branch" = "main" ]; then \
		echo "ERROR: You're on main branch. Switch to the branch with the draft PR."; \
		exit 1; \
	fi; \
	echo "Looking for draft PR for branch: $$current_branch"; \
	pr_number=$$(gh pr list --head "$$current_branch" --state open --json number --jq '.[0].number' 2>/dev/null); \
	if [ -z "$$pr_number" ] || [ "$$pr_number" = "null" ]; then \
		echo "ERROR: No open PR found for branch $$current_branch"; \
		echo "Create a draft PR first with: make draft-pr"; \
		exit 1; \
	fi; \
	pr_status=$$(gh pr view "$$pr_number" --json isDraft --jq '.isDraft'); \
	if [ "$$pr_status" = "false" ]; then \
		echo "PR #$$pr_number is already ready for review"; \
		gh pr view "$$pr_number" --web; \
		exit 0; \
	fi; \
	echo "Promoting PR #$$pr_number to ready for review..."; \
	gh pr ready "$$pr_number" || { echo "ERROR: Failed to promote PR"; exit 1; }; \
	echo "✅ PR #$$pr_number is now ready for review"; \
	gh pr view "$$pr_number" --web

## pr_wait_and_merge   Wait for status checks on current branch's PR, then merge it
pr_wait_and_merge:
	@echo "Delegating PR wait and merge to scripts/pr-wait-and-merge.sh"
	@if [ ! -x scripts/pr-wait-and-merge.sh ]; then \
		echo "ERROR: scripts/pr-wait-and-merge.sh not found or executable"; exit 1; \
	fi
	@./scripts/pr-wait-and-merge.sh --timeout $(PR_TIMEOUT) || { echo "ERROR: PR validation/merge failed"; exit 1; }

# Complete release using existing PR (works with draft or ready PRs)
release-existing:
	@echo "Starting release process using existing PR..."
	$(call check_gh_cli)
	@# Get current branch and find associated PR
	@current_branch=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$current_branch" = "main" ]; then \
		echo "ERROR: You're on main branch. Switch to the branch with the PR to release."; \
		exit 1; \
	fi; \
	if [ -z "$(CURRENT_VERSION)" ]; then \
		echo "ERROR: Could not read version from package.json"; \
		exit 1; \
	fi; \
	echo "Looking for PR for branch: $$current_branch"; \
	pr_number=$$(gh pr list --head "$$current_branch" --state open --json number --jq '.[0].number' 2>/dev/null); \
	if [ -z "$$pr_number" ] || [ "$$pr_number" = "null" ]; then \
		echo "ERROR: No open PR found for branch $$current_branch"; \
		echo "Create a PR first with: make draft-pr"; \
		exit 1; \
	fi; \
	pr_status=$$(gh pr view "$$pr_number" --json isDraft --jq '.isDraft'); \
	echo "Found PR #$$pr_number (draft: $$pr_status)"; \
	echo "Version: $(CURRENT_VERSION)"; \
	echo ""; \
	echo "This will:"; \
	if [ "$$pr_status" = "true" ]; then \
		echo "  1. Promote draft PR #$$pr_number to ready for review"; \
	fi; \
	echo "  2. Wait for GitHub Actions validation to pass"; \
	echo "  3. Auto-merge PR when validation succeeds"; \
	echo "  4. Create GitHub release"; \
	echo "  5. Update AUR package"; \
	echo ""; \
	if [ "$(ACCEPT_ALL)" != "1" ]; then \
		read -p "Continue? [y/N] " confirm; \
		if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
			echo "Release cancelled."; \
			exit 0; \
		fi; \
	else \
		echo "Auto-accepting due to ACCEPT_ALL=1"; \
	fi; \
	if [ "$$pr_status" = "true" ]; then \
		echo "Promoting draft PR to ready for review..."; \
		gh pr ready "$$pr_number" || { echo "ERROR: Failed to promote PR"; exit 1; }; \
		echo "✅ PR promoted to ready for review"; \
	fi; \
	# Wait for checks and merge using common helper
	$(MAKE) pr_wait_and_merge || { echo "ERROR: PR validation/merge failed"; exit 1; }; \
	echo "Switching to main branch for releases..."; \
	git checkout main && git pull origin main || { echo "ERROR: Failed to update main branch"; exit 1; }; \
	echo "Creating GitHub release..."; \
	$(MAKE) release || { echo "ERROR: GitHub release failed"; exit 1; }; \
	echo "Updating AUR package..."; \
	$(MAKE) release-aur || { echo "ERROR: AUR update failed"; exit 1; }; \
	echo ""; \
	echo "🎉 Complete release process finished!"; \
	echo "✅ Version $(CURRENT_VERSION) released on GitHub"; \
	echo "✅ AUR package updated"
