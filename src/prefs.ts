/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Adw from "gi://Adw";
// @ts-ignore: imported for runtime only (GJS)
import Gio from "gi://Gio";
// @ts-ignore: imported for runtime only (GJS)
import GLib from "gi://GLib";
// @ts-ignore: imported for runtime only (GJS)
import Gtk from "gi://Gtk";
// @ts-ignore: imported for runtime only (GJS)
import Gdk from "gi://Gdk";

// @ts-ignore: runtime resource provided by GNOME Shell
import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import { prefsGettext } from "./utils/gettext/index.js";
import { WINDOW_TITLE } from "./constants/prefs.js";
import { gjsLogger } from "./utils/logging/logger_gjs.js";

// SettingsKey is not needed in this thin wrapper
import { getShellVersion } from "./prefs/helpers.js";
import { createGeneralPage } from "./prefs/pages/general_page/index.js";
import { createColorsPage } from "./prefs/pages/color_page/index.js";

/**
 * Preferences UI entrypoint for the Text Clock extension.
 *
 * This file is the GNOME Extensions prefs entrypoint and must remain at the
 * project root (`src/prefs.ts`) so the Shell can discover and load the
 * preferences UI. It wires together small helper modules under
 * `src/prefs/` to build the preferences window without requiring GJS types in
 * this wrapper.
 */
export default class TextClockPrefs extends ExtensionPreferences {
  /**
   * Populate the provided preferences window with pages and groups.
   *
   * The method retrieves the extension settings, detects the running GNOME
   * Shell version (to decide whether accent colors are supported), then
   * composes the preference UI by delegating to helper functions.
   *
   * @param window - Adw.PreferencesWindow instance provided by the Shell
   * @returns Promise<void> resolves when the window is filled
   */
  async fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    // ExtensionPreferences in the Shell provides getSettings at runtime; cast
    // to any to satisfy the TypeScript declaration here.
    const settings = (this as any).getSettings();
    // Window presentation: match the example extension UX
    window.search_enabled = true;

    // Title (localized)
    window.title = prefsGettext._(WINDOW_TITLE);

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

    return Promise.resolve();
  }
}
