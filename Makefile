# Header Section
NAME=text-clock
DOMAIN=benica.dev
MO_FILES=$(wildcard po/*.mo)
ZIP_FILE=$(NAME)@${DOMAIN}.zip
TS_FILES=$(wildcard *.ts) $(wildcard ui/*.ts) $(wildcard constants/**/*.ts) $(wildcard utils/*.ts)
DIST_DIR=dist
LOCALE_DIR=locale
GNOME_SHELL_EXT_DIR=$(HOME)/.local/share/gnome-shell/extensions

# Build configuration
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DELETE_ON_ERROR:
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules

########################
# Function Definitions
########################

define copy_and_modify
	@cp $(1) $(2)
	$(foreach cmd,$(3),sed -i $(cmd) $(2) || { echo "Modifying $(2) failed"; exit 1; };)
endef

################################
# Phony Targets
################################

.PHONY: all pack install pot create_ext_dir patch-dts-files clean test prepare_constants_test validate build build-dist

################################
# Main Build Targets
################################

# Default target - Build and validate everything
all: validate

# Build TypeScript incrementally
build: $(DIST_DIR)/extension.js

# Build distribution package
build-dist: $(DIST_DIR)/extension.js schemas/gschemas.compiled locale/
	@echo "Building distribution package..."
	@mkdir -p $(DIST_DIR)
	@cp -r schemas $(DIST_DIR)/ 2>/dev/null || true
	@cp metadata.json $(DIST_DIR)/ 2>/dev/null || true
	@cp -r $(LOCALE_DIR) $(DIST_DIR)/ 2>/dev/null || true
	@echo "Distribution package ready in $(DIST_DIR)/"

# Package the extension into a zip file
pack: build-dist ${ZIP_FILE}

# Generate a new POT file
pot: po/${NAME}@${DOMAIN}.pot

# Install the extension into the local GNOME Shell extensions directory
install: create_ext_dir build-dist
	@echo "Installing the extension..."
	@rm -rf $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN) || { echo "Removing existing extension failed"; exit 1; }
	@cp -R $(DIST_DIR) $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN) || { echo "Copying extension failed"; exit 1; }
	@echo "Installation complete."

################################
# Helper Targets
################################

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

# Compile TypeScript files incrementally
$(DIST_DIR)/extension.js: $(TS_FILES) node_modules/
	@echo "Compiling TypeScript files..."
	@yarn tsc -p config/tsconfig.json || { echo "TypeScript compilation failed"; exit 1; }

# Ensure node modules are installed based on package.json before proceeding
node_modules/: package.json
	@echo "Installing node modules..."
	yarn install --frozen-lockfile || { echo "yarn install failed"; exit 1; }
	@$(MAKE) patch-dts-files

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
	yarn tsc -p config/tsconfig.pot.json || { echo "TypeScript compilation failed"; exit 1; }
	xgettext --from-code=UTF-8 --keyword=_ --output=po/text-clock@benica.dev.pot dist/constants_*_extension.js || { echo "Generating POT file failed"; exit 1; }

################################
# Patch and Prepare Section
# This section includes tasks for patching files and preparing constants for 
# testing (probably deprecated at this point)
################################

# Patch TypeScript definition files - add .js extension to relative import paths
patch-dts-files:
	@echo "Patching TypeScript definition files..."
	find node_modules/@girs/gnome-shell/dist/ui -name "*.d.ts" -print0 | xargs -0 perl -pi -e 's/from \x27\.(.*?)(?<!\.js)\x27;/from \x27.\1.js\x27;/g' || { echo "Patching d.ts files failed"; exit 1; }

# Copy and modify the Times constants file to use with preferences
constants/times/prefs.ts: constants/times/extension.ts
	$(call copy_and_modify,constants/times/extension.ts,constants/times/prefs.ts,\
		's|resource:///org/gnome/shell/extensions/extension.js|resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js|g')

# Copy and modify the dates constants file to use with preferences
constants/dates/prefs.ts: constants/dates/extension.ts
	$(call copy_and_modify,constants/dates/extension.ts,constants/dates/prefs.ts,\
		's|resource:///org/gnome/shell/extensions/extension.js|resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js|g')

################################
# Testing Section
################################

# Run tests (comprehensive)
test: node_modules/
	@echo "Running tests..."
	@yarn tsc -p config/tsconfig.test.json || { echo "TypeScript compilation failed"; exit 1; }
	@yarn test

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
