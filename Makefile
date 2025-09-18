# Header Section: variable definitions and paths used by targets
NAME=text-clock
DOMAIN=benica.dev
MO_FILES=$(wildcard po/*.mo)
ZIP_FILE=$(NAME)@${DOMAIN}.zip
TS_FILES=$(wildcard *.ts) $(wildcard ui/*.ts) $(wildcard constants/**/*.ts) $(wildcard utils/*.ts)
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

.PHONY: all pack install pot create_ext_dir clean test validate compile build check-deps

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
	@yarn_version=$$(yarn --version 2>/dev/null || echo "0"); \
	major=$$(echo $$yarn_version | sed -E 's/^([0-9]+).*/\1/'); \
	if [ -z "$$major" ] || [ $$major -lt 4 ]; then \
		echo "ERROR: Yarn v4 or later is required (found: $$yarn_version). Please install the recommended Yarn version."; exit 1; \
	fi
	@command -v node >/dev/null 2>&1 || { echo "ERROR: node is not installed or not on PATH."; exit 1; }
	@command -v perl >/dev/null 2>&1 || { echo "ERROR: perl is not installed or not on PATH."; exit 1; }
	@command -v glib-compile-schemas >/dev/null 2>&1 || { echo "ERROR: glib-compile-schemas is not installed or not on PATH."; exit 1; }
	@command -v zip >/dev/null 2>&1 || { echo "ERROR: zip is not installed or not on PATH."; exit 1; }
	@command -v xgettext >/dev/null 2>&1 || { echo "ERROR: xgettext (gettext) is not installed or not on PATH."; exit 1; }
	@echo "check-deps: OK (yarn $$yarn_version)"

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
