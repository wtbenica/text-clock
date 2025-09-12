# Header Section
NAME=text-clock
DOMAIN=benica.dev
MO_FILES=$(wildcard po/*.mo)
ZIP_FILE=$(NAME)@${DOMAIN}.zip
TS_FILES=$(wildcard *.ts) $(wildcard ui/*.ts)
DIST_DIR=dist
LOCALE_DIR=locale
GNOME_SHELL_EXT_DIR=$(HOME)/.local/share/gnome-shell/extensions

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

.PHONY: pack install pot create_ext_dir patch-dts-files clean test prepare_constants_test

################################
# Main Build Targets
################################

# Default target - Pack the extension into a zip file
pack: ${ZIP_FILE}
	@echo "Zipfile complete."

# Install the extension into the local GNOME Shell extensions directory
install: create_ext_dir ${ZIP_FILE} locale/
	@echo "Installing the extension..."
	rm -rf $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN) || { echo "Removing existing extension failed"; exit 1; }
	cp -R $(DIST_DIR) $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN) || { echo "Copying extension failed"; exit 1; }
	@echo "Installation complete."

# Generate a new POT file
pot: po/${NAME}@${DOMAIN}.pot

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

# Compile TypeScript files into JavaScript
$(DIST_DIR)/extension.js: $(TS_FILES)
	@echo "Compiling TypeScript files..."
	yarn tsc || { echo "TypeScript compilation failed"; exit 1; }

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
	yarn tsc -p tsconfig.pot.json || { echo "TypeScript compilation failed"; exit 1; }
	xgettext --from-code=UTF-8 --keyword=_ --output=po/text-clock@benica.dev.pot dist/constants_*_extension.js || { echo "Generating POT file failed"; exit 1; }

################################
# Patch and Prepare Section
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

# Run tests
test: node_modules/ constants/dates/test.ts constants/times/test.ts
	@echo "Running tests..."
	yarn tsc -p tsconfig.test.json || { echo "TypeScript compilation failed"; exit 1; }
	yarn test
	rm constants_dates_test.ts constants_times_test.ts || { echo "Removing test files failed"; exit 1; }
	rm -rf dist || { echo "Removing dist directory failed"; exit 1; }

# Copy and modify the dates constants file for testing
constants/dates/test.ts: constants/dates/extension.ts
	set -e; \
	cp constants/dates/extension.ts constants/dates/test.ts; \
	sed -i '/^import /,+4d' constants/dates/test.ts; \
	sed -i '/pgettext(/,+1d' constants/dates/test.ts; \
	sed -i '/^[TAB ]*),/d' constants/dates/test.ts; \
	ed -i '{N; s/,\s\+)\;/\;/;}' constants/dates/test.ts; \
	sed -i "s/_('\([^']*\)')/'\1'/g" constants/dates/test.ts; \
	yarn format > /dev/null 2>&1

# Copy and modify the times constants file for testing
constants/times/test.ts: constants/times/extension.ts
	set -e; \
	cp constants/times/extension.ts constants/times/test.ts; \
	sed -i '/^import /,+4d' constants/times/test.ts; \
	sed -i "s/pgettext('[^']*',\s*\('[^']*'\))/\1/g" constants/times/test.ts; \
	sed -i "s/pgettext('[^']*',\s*\(\"%s o'clock\"\))/\1/g" constants/times/test.ts; \
	yarn format > /dev/null 2>&1

################################
# Clean 
################################

# Clean up the project directory
clean:
	@echo "Cleaning up..."
	@echo "Removing zip file: $(ZIP_FILE)"
	rm -rf $(DIST_DIR) || { echo "Removing dist directory failed"; exit 1; }
	rm -rf node_modules/ || { echo "Removing node_modules directory failed"; exit 1; }
	rm -rf ${ZIP_FILE} || { echo "Removing zip file failed"; exit 1; }
	@echo "Removing locale directory: $(LOCALE_DIR)"
	rm -rf $(LOCALE_DIR) || { echo "Removing locale directory failed"; exit 1; }
	@echo "Removing compiled GSettings schemas..."
	rm -f schemas/gschemas.compiled || { echo "Removing compiled GSettings schemas failed"; exit 1; }
	@echo "Removing node modules..."
	rm -rf node_modules/ || { echo "Removing node_modules directory failed"; exit 1; }
	@echo "Removing yarn.lock file..."
	rm -f yarn.lock || { echo "Removing yarn.lock file failed"; exit 1; }
	@echo "Cleaning up complete."
