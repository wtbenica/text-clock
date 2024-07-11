NAME=text-clock-ts
DOMAIN=benica.dev

.PHONY: all pack install clean test

all: dist/extension.js

node_modules: package.json
	npm install

dist/extension.js dist/prefs.js: node_modules
	tsc

schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	glib-compile-schemas schemas

$(NAME).zip: dist/extension.js dist/prefs.js schemas/gschemas.compiled
	@cp -r schemas dist/
	@cp metadata.json dist/
	@(cd dist && zip ../$(NAME).zip -9r .)

pack: $(NAME).zip

install: $(NAME).zip
	@touch ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@rm -rf ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	# make locale if it doesn't exist
	@test -d locale || mkdir locale
	# for each .mo file in ./po, create a directory in locale with the same name and copy the .mo file there as ${NAME}@${DOMAIN}.mo
	@for file in po/*.mo; do \
		lang=$$(basename $$file .mo); \
		mkdir -p locale/$$lang/LC_MESSAGES; \
		cp $$file locale/$$lang/LC_MESSAGES/$(NAME)@$(DOMAIN).mo; \
	done
	@cp -r locale dist/
	@mv dist ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)

clean:
	@rm -rf dist node_modules $(NAME).zip

test: node_modules
	@rm -rf dist
	tsc
	npm test
