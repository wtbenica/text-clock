/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Adw from "gi://Adw";

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

// SettingsKey is not needed in this thin wrapper
import {
  createAndAddPageToWindow,
  createAndAddGroupToPage,
  addShowDateSwitchRow,
  addShowWeekdaySwitchRow,
  addTimeFormatComboRow,
  createFuzzinessComboRow,
  addDividerPresetRow,
  addColorModeRow,
  getShellVersion,
} from "./prefs/helpers.js";

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
    const settings = this.getSettings();

    // Check GNOME Shell version to determine if accent color is available
    const shellVersion = getShellVersion();
    const supportsAccentColor = shellVersion >= 47;

    // Create two separate pages: General settings and Colors.
    const generalPage = createAndAddPageToWindow(window, "General");
    const colorsPage = createAndAddPageToWindow(window, "Colors");

    const clockSettingsGroup = createAndAddGroupToPage(
      generalPage,
      "Clock Settings",
      "Customize the appearance and behavior of the clock",
    );

    addShowDateSwitchRow(clockSettingsGroup, settings);
    addShowWeekdaySwitchRow(clockSettingsGroup, settings);
    addTimeFormatComboRow(clockSettingsGroup, settings);
    createFuzzinessComboRow(clockSettingsGroup, settings);
    addDividerPresetRow(clockSettingsGroup, settings);

    const clockColorSettingsGroup = createAndAddGroupToPage(
      colorsPage,
      "Clock Colors",
      "Customize the colors of the clock and date text",
    );

    addColorModeRow(clockColorSettingsGroup, settings, supportsAccentColor);

    return Promise.resolve();
  }
}
