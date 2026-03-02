/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Adw from "gi://Adw";
import Gdk from "gi://Gdk";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
  ngettext,
  pgettext,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

// SettingsKey is not needed in this thin wrapper
import { getShellVersion } from "./presentation/preferences/helpers.js";
import { createColorsPage } from "./presentation/preferences/pages/color_page/index.js";
import { createGeneralPage } from "./presentation/preferences/pages/general_page/index.js";
import { createCustomMessagesPage } from "./presentation/preferences/pages/custom_messages_page.js";
import {
  initPrefsGettext,
  prefsGettext,
} from "./utils/gettext/gettext_utils_prefs.js";
import { gjsLogger } from "./utils/logging/logger_gjs.js";

// Initialize gettext functions with the real GNOME Shell functions
initPrefsGettext(_, ngettext, pgettext);

/**
 * Preferences UI for the Text Clock extension.
 *
 * This file must stay at the project root so GNOME Shell can load it.
 * The actual UI is built using helpers from `presentation/preferences/`.
 */
export default class TextClockPrefs extends ExtensionPreferences {
  /**
   * Build the preferences window with General and Colors pages.
   *
   * Loads extension resources (icons), detects GNOME Shell version for
   * accent color support, and creates preference pages.
   */
  async fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    // ExtensionPreferences in the Shell provides getSettings at runtime; cast
    // to any to satisfy the TypeScript declaration here.
    const settings = (this as any).getSettings();
    // Window presentation: match the example extension UX
    window.search_enabled = true;

    // Title (localized)
    window.title = prefsGettext._("Text Clock Prefs");

    // If a compiled gresource binary is present in the extension's
    // directory, register it so the preferences UI can use extension-provided
    // icons. Failure to register is non-fatal and will fall back to system
    // symbolic icons.
    try {
      const resourcePath = GLib.build_filenamev([
        (this as any).path,
        "preferences.gresource",
      ]);
      if (GLib.file_test(resourcePath, GLib.FileTest.EXISTS)) {
        const resource = Gio.Resource.load(resourcePath);
        Gio.resources_register(resource);
        const display = Gdk.Display.get_default();
        if (display !== null) {
          const iconTheme = Gtk.IconTheme.get_for_display(display);
          iconTheme.add_resource_path(
            "/org/gnome/shell/extensions/text-clock/preferences/icons",
          );
        }
      }
    } catch (e) {
      // Not fatal — fall back to system symbolic icons. Use the project's
      // GJS logger helper so logs are consistent with the rest of the codebase.
      if (e instanceof Error) {
        gjsLogger.logError(e, "prefs: could not load compiled gresource");
      } else {
        gjsLogger.log("prefs: could not load compiled gresource:", e);
      }
    }

    // Check GNOME Shell version to determine if accent color is available
    const shellVersion = getShellVersion();
    const supportsAccentColor = shellVersion >= 47;

    // Build each page via the page modules so page logic is encapsulated
    // within the page implementation.
    createGeneralPage(window, settings);
    createColorsPage(window, settings, supportsAccentColor);

    createCustomMessagesPage(window, settings);

    return Promise.resolve();
  }
}
