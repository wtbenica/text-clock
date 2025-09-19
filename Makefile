# Header Section: variable definitions and paths used by targets
NAME=text-clock
DOMAIN=benica.dev
MO_FILES=$(wildcard po/*.mo)
ZIP_FILE=$(NAME)@${DOMAIN}.zip
TS_FILES=$(wildcard *.ts) $(wildcard ui/*.ts) $(wildcard constants/**/*.ts) $	# Get current and new version from JSON output
	@version_info=$$(node scripts/bump-version.cjs $(TYPE) --json); \
	current_version=$$(echo "$$version_info" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).current.version"); \
	new_version=$$(echo "$$version_info" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).new.version"); \
	echo "Current version: $$current_version"; \
	echo "Target version: $$new_version"; \ utils/*.ts)
DIST_DIR=dist
LOCALE_DIR=locale
GNOME_SHELL_EXT_DIR=$(HOME)/.local/share/gnome-shell/extensions

# Build configuration (shell flags, make behavior).
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DELETE_ON_ERROR:
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules

# ########################
# Function Definitions
# ########################

define copy_and_modify
	@cp $(1) $(2)
	$(foreach cmd,$(3),sed -i $(cmd) $(2) || { echo "Modifying $(2) failed"; exit 1; };)
endef

# ################################
# Phony Targets
# ################################

.PHONY: all pack install pot create_ext_dir clean test validate compile build check-deps release bump-version

# ################################
# Main Build Targets
#
# Notes:
# - `make`/`make all` runs the `validate` target (lint + tests + build).
# - `compile` compiles TypeScript into `dist/` using `tsc`.
# - `build` prepares the `dist/` directory for distribution
# - `pack` zips the `dist/` folder for distribution as a GNOME Shell
#   extension.
# ################################

# Default target - run validation pipeline (lint, tests, build)
all: validate

# Check required external tools and environment
# Verifies yarn, node, perl, glib-compile-schemas, zip, and xgettext
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
compile: $(DIST_DIR)/extension.js

# Prepare the `dist/` directory for distribution
# Puts all required files (compiled JS, metadata, schemas, locale) into `dist/`.
build: $(DIST_DIR)/extension.js schemas/gschemas.compiled locale/
	@echo "Building distribution package..."
	@mkdir -p $(DIST_DIR)
	@cp -r schemas $(DIST_DIR)/ 2>/dev/null || true
	@cp metadata.json $(DIST_DIR)/ 2>/dev/null || true
	@cp -r $(LOCALE_DIR) $(DIST_DIR)/ 2>/dev/null || true
	@echo "Distribution package ready in $(DIST_DIR)/"

# Package the extension into a zip file (zips the contents of `dist/`)
pack: build ${ZIP_FILE}

# Generate a new POT file (collects translatable strings from compiled JS)
pot: po/${NAME}@${DOMAIN}.pot

# Install the extension into the local GNOME Shell extensions directory
install: create_ext_dir build
	@echo "Installing the extension..."
	@rm -rf $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN) || { echo "Removing existing extension failed"; exit 1; }
	@cp -R $(DIST_DIR) $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN) || { echo "Copying extension failed"; exit 1; }
	@echo "Installation complete."

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


################################
# Testing Section
################################

# Run tests (comprehensive)
test: node_modules/
	@echo "Running tests..."
	@command -v yarn >/dev/null 2>&1 || { echo "ERROR: yarn is required to run tests; please install and try again."; exit 1; }
	@yarn tsc -p config/tsconfig.test.json || { echo "TypeScript compilation failed"; exit 1; }
	@yarn test || { echo "yarn test failed"; exit 1; }

# Validate the entire project
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

# Release the current version by creating and pushing a git tag
release: check-deps
	@echo "Starting release process..."
	@# Verify we're on main branch
	@current_branch=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$current_branch" != "main" ]; then \
		echo "ERROR: You must be on the main branch to release. Currently on: $$current_branch"; \
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
	@# Run validation to ensure everything is working
	@echo "Running validation..."
	@$(MAKE) validate || { echo "ERROR: Validation failed. Fix issues before releasing."; exit 1; }
	@# Get current version and create tag
	@current_version=$$(node -pe "require('./package.json').version"); \
	echo "Creating release for version $$current_version..."; \
	git tag "v$$current_version" || { echo "ERROR: Failed to create tag v$$current_version"; exit 1; }; \
	git push origin "v$$current_version" || { echo "ERROR: Failed to push tag v$$current_version"; exit 1; }
	@echo "✅ Release complete! GitHub Actions will create the release automatically."
	@echo "   Check the release at: https://github.com/wtbenica/text-clock/releases"

# Bump version and create a pull request for the next version
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
	@current_version=$$(node -pe "require('./package.json').version"); \
	echo "Current version: $$current_version"; \
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
