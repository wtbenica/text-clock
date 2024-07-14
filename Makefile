NAME=text-clock
DOMAIN=benica.dev
MO_FILES=$(wildcard po/*.mo)

.PHONY: all pack install clean test prepare_locale

# Default target: build the main JavaScript file for the extension
all: dist/extension.js
	@echo "Building the main JavaScript file..."

# Ensure node_modules are installed based on package.json before proceeding
node_modules: package.json
	@echo "Installing node modules..."
	npm install
	@$(MAKE) patch-dts-files

# Compile TypeScript files into JavaScript
dist/extension.js dist/prefs.js: node_modules
	@echo "Compiling TypeScript files..."
	tsc

# Compile GSettings schemas
schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	@echo "Compiling GSettings schemas..."
	glib-compile-schemas schemas

# Package the extension into a zip file, including schemas, metadata, and locale
$(NAME).zip: dist/extension.js dist/prefs.js schemas/gschemas.compiled prepare_locale
	@echo "Packaging the extension..."
	@cp -r schemas dist/
	@cp metadata.json dist/
	@cp -r locale dist/
	@(cd dist && zip ../$(NAME).zip -9r .)

# Phony target for packaging the extension
pack: $(NAME).zip
	@echo "Packing the extension..."

# Prepare locale directory and copy .mo files for internationalization
prepare_locale: $(MO_FILES)
	@echo "Preparing locale..."
	@test -d locale || mkdir locale
	@for file in $(MO_FILES); do \
		lang=$$(basename $$file .mo); \
		mkdir -p locale/$$lang/LC_MESSAGES; \
		cp $$file locale/$$lang/LC_MESSAGES/$(NAME)@$(DOMAIN).mo; \
	done

# Install the extension by moving the dist folder to the GNOME extensions directory
install: $(NAME).zip prepare_locale
	@echo "Installing the extension..."
	@touch ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@rm -rf ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@mv dist ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@echo "Installation complete."

# Clean up build artifacts and dependencies
clean:
	@echo "Cleaning up..."
	@rm -rf dist node_modules $(NAME).zip

# Run tests after ensuring TypeScript compilation
test: node_modules
	@echo "Running tests..."
	@rm -rf dist
	tsc
	npm test

# Patch TypeScript definition files to correct import paths
patch-dts-files:
	@echo "Patching TypeScript definition files..."
	@perl -pi -e 's/from \x27\.(.*?)(?<!\.js)\x27;/from \x27.\1.js\x27;/g' node_modules/@girs/gnome-shell/dist/ui/workspace.d.ts
	@perl -pi -e 's/from \x27\.(.*?)(?<!\.js)\x27;/from \x27.\1.js\x27;/g' node_modules/@girs/gnome-shell/dist/ui/workspacesView.d.ts