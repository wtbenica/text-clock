NAME=text-clock
DOMAIN=benica.dev
MO_FILES=$(wildcard po/*.mo)
ZIP_FILE=$(NAME)@${DOMAIN}.zip
DIST_DIR=dist
LOCALE_DIR=locale
GNOME_SHELL_EXT_DIR=$(HOME)/.local/share/gnome-shell/extensions

.PHONY: all pack install clean test prepare_locale patch-dts-files

# Default target: build the main JavaScript file for the extension
all: $(DIST_DIR)/extension.js
	@echo "Building the main JavaScript file..."

# Ensure node_modules are installed based on package.json before proceeding
node_modules: package.json
	@echo "Installing node modules..."
	@npm install || { echo "npm install failed"; exit 1; }
	@$(MAKE) patch-dts-files
	
# Compile TypeScript files into JavaScript
$(DIST_DIR)/extension.js $(DIST_DIR)/prefs.js: node_modules prepare_constants_times_prefs
	@echo "Compiling TypeScript files..."
	@npx tsc || { echo "TypeScript compilation failed"; exit 1; }

# Compile GSettings schemas
schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	@echo "Compiling GSettings schemas..."
	@glib-compile-schemas schemas || { echo "GSettings schema compilation failed"; exit 1; }

# Package the extension into a zip file, including schemas, metadata, and locale,
${ZIP_FILE}: $(DIST_DIR)/extension.js $(DIST_DIR)/prefs.js schemas/gschemas.compiled prepare_locale
	@echo "Packaging the extension..."
	@cp -r schemas $(DIST_DIR)/ || { echo "Copying schemas failed"; exit 1; }
	@cp metadata.json $(DIST_DIR)/ || { echo "Copying metadata.json failed"; exit 1; }
	@cp -r $(LOCALE_DIR) $(DIST_DIR)/ || { echo "Copying locale directory failed"; exit 1; }
	@(cd $(DIST_DIR) && zip ../${ZIP_FILE} -9r .) || { echo "Zipping extension failed"; exit 1; }

# Phony target for packaging the extension
pack: ${ZIP_FILE}
	@echo "Packing the extension..."

# Prepare locale directory and copy .mo files for internationalization
prepare_locale: $(MO_FILES)
	@echo "Preparing locale..."
	@test -d $(LOCALE_DIR) || mkdir $(LOCALE_DIR) || { echo "Creating locale directory failed"; exit 1; }
	@for file in $(MO_FILES); do \
		lang=$$(basename $$file .mo); \
		mkdir -p $(LOCALE_DIR)/$$lang/LC_MESSAGES || { echo "Creating message directory for $$lang failed"; exit 1; }; \
		cp $$file $(LOCALE_DIR)/$$lang/LC_MESSAGES/$(NAME)@$(DOMAIN).mo || { echo "Copying $$file failed"; exit 1; }; \
	done

# Ensure the local GNOME Shell extensions directory exists
create_ext_dir:
	@echo "Ensuring GNOME Shell extensions directory exists..."
	@test -d $(GNOME_SHELL_EXT_DIR) || mkdir -p $(GNOME_SHELL_EXT_DIR) || { echo "Creating GNOME Shell extensions directory failed"; exit 1; }

# Install the extension by moving the dist folder to the GNOME extensions directory
install: create_ext_dir ${ZIP_FILE} prepare_locale
	@echo "Installing the extension..."
	@touch $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN)
	@rm -rf $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN)
	@mv $(DIST_DIR) $(GNOME_SHELL_EXT_DIR)/$(NAME)@$(DOMAIN)
	@echo "Installation complete."

# Clean up build artifacts and dependencies
clean:
	@echo "Cleaning up..."
	@echo "Removing zip file: $(ZIP_FILE)"
	@rm -rf $(DIST_DIR) node_modules ${ZIP_FILE}
	@rm -rf $(LOCALE_DIR)

# Run tests after ensuring TypeScript compilation
test: clean node_modules
	@echo "Running tests..."
	@npx tsc
	@npm test

# Patch TypeScript definition files to correct import paths
patch-dts-files:
	@echo "Patching TypeScript definition files..."
	@perl -pi -e 's/from \x27\.(.*?)(?<!\.js)\x27;/from \x27.\1.js\x27;/g' node_modules/@girs/gnome-shell/dist/ui/workspace.d.ts || { echo "Patching workspace.d.ts failed"; exit 1; }
	@perl -pi -e 's/from \x27\.(.*?)(?<!\.js)\x27;/from \x27.\1.js\x27;/g' node_modules/@girs/gnome-shell/dist/ui/workspacesView.d.ts || { echo "Patching workspacesView.d.ts failed"; exit 1; }
	
# Copy strings for use in prefs
prepare_constants_times_prefs:
	@echo "Preparing constants_times_prefs.ts..."
	@cp constants_times_extension.ts constants_times_prefs.ts
	@sed -i 's|resource:///org/gnome/shell/extensions/extension.js|resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js|g' constants_times_prefs.ts || { echo "Modifying import paths in constants_times_prefs.ts failed"; exit 1; }
	@sed -i 's|constants_dates_extension.js|constants_dates_prefs.js|g' constants_times_prefs.ts || { echo "Modifying import paths in constants_times_prefs.ts failed"; exit 1; }
	@cp constants_dates_extension.ts constants_dates_prefs.ts
	@sed -i 's|resource:///org/gnome/shell/extensions/extension.js|resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js|g' constants_dates_prefs.ts || { echo "Modifying import paths in constants_times_prefs.ts failed"; exit 1; }
