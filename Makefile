NAME=text-clock
DOMAIN=benica.dev
MO_FILES=$(wildcard po/*.mo)

.PHONY: all pack install clean test prepare_locale

all: dist/extension.js

node_modules: package.json
	npm install

dist/extension.js dist/prefs.js: node_modules
	tsc

schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	glib-compile-schemas schemas

$(NAME).zip: dist/extension.js dist/prefs.js schemas/gschemas.compiled prepare_locale
	@cp -r schemas dist/
	@cp metadata.json dist/
	@cp -r locale dist/
	@(cd dist && zip ../$(NAME).zip -9r .)

pack: $(NAME).zip

prepare_locale: $(MO_FILES)
	@test -d locale || mkdir locale
	@for file in $(MO_FILES); do \
		lang=$$(basename $$file .mo); \
		mkdir -p locale/$$lang/LC_MESSAGES; \
		cp $$file locale/$$lang/LC_MESSAGES/$(NAME)@$(DOMAIN).mo; \
	done

install: $(NAME).zip prepare_locale
	@touch ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@rm -rf ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@mv dist ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)

clean:
	@rm -rf dist node_modules $(NAME).zip

test: node_modules
	@rm -rf dist
	tsc
	npm test
