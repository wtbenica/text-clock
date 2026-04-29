/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Automatic preference UI generation from configuration arrays.
 *
 * Creates combo rows, switch rows, and preset+custom entry combinations
 * with automatic GSettings binding.
 */

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import SettingsKey from "../../../models/settings_keys";
import {
  BasePreferenceConfig,
  CustomPreferenceConfig,
} from "../../../models/preference_types";
import { logWarn } from "../../../utils/error_utils.js";
import { prefsGettext } from "../../../utils/gettext/gettext_utils_prefs.js";

/**
 * Configuration for creating preference UI rows.
 */
export interface PreferenceRowConfig {
  /** Main title displayed in the row */
  title: string;

  /** Optional subtitle/description displayed under the title */
  subtitle?: string;

  /** Whether the row should be initially sensitive (enabled) */
  sensitive?: boolean;
}

/**
 * Create enum combo row with automatic GSettings binding.
 * Validates current setting and resets to 0 if out of bounds.
 */
export function createEnumComboRow<T extends BasePreferenceConfig>(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
  settingsKey: SettingsKey | string,
  configs: readonly T[],
  rowConfig: PreferenceRowConfig,
): Adw.ComboRow {
  const { _ } = prefsGettext;

  // Create display strings by calling the translation functions
  const displayStrings = configs.map((config) =>
    config.displayName(prefsGettext),
  );

  // Get current selection from settings
  let currentSelected = settings.get_enum(settingsKey);

  if (currentSelected < 0 || currentSelected >= configs.length) {
    // Log a warning if the current setting is out of bounds
    logWarn(
      `Warning: Settings key ${settingsKey} has invalid enum value ${currentSelected}. Resetting to 0.`,
    );
    settings.set_enum(settingsKey, 0);
    currentSelected = 0;
  }

  // Create combo row
  const comboRow = new Adw.ComboRow({
    title: _(rowConfig.title),
    subtitle: rowConfig.subtitle ? _(rowConfig.subtitle) : undefined,
    model: new Gtk.StringList({ strings: displayStrings }),
    selected: currentSelected,
    sensitive: rowConfig.sensitive !== false,
  });

  group.add(comboRow);

  // Bind changes back to settings
  comboRow.connect("notify::selected", () => {
    settings.set_enum(settingsKey, comboRow.selected);
  });

  return comboRow;
}

/** Create switch row for boolean preferences with automatic GSettings binding. */
export function createBooleanSwitchRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
  settingsKey: SettingsKey | string,
  rowConfig: PreferenceRowConfig,
): Adw.SwitchRow {
  const { _ } = prefsGettext;

  const switchRow = new Adw.SwitchRow({
    title: _(rowConfig.title),
    subtitle: rowConfig.subtitle ? _(rowConfig.subtitle) : undefined,
    active: settings.get_boolean(settingsKey),
    sensitive: rowConfig.sensitive !== false,
  });

  group.add(switchRow);

  // Bind changes back to settings
  settings.bind(
    settingsKey,
    switchRow as any,
    "active",
    Gio.SettingsBindFlags.DEFAULT,
  );

  return switchRow;
}

/**
 * Create preset combo row with custom entry row.
 * Entry row visibility toggles when "Custom" preset is selected.
 */
export function createPresetWithCustomRow<T extends BasePreferenceConfig>(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
  presetSettingsKey: SettingsKey | string,
  customSettingsKey: SettingsKey | string,
  configs: readonly T[],
  rowConfig: PreferenceRowConfig,
  customRowConfig?: PreferenceRowConfig,
): { comboRow: Adw.ComboRow; entryRow: Adw.EntryRow } {
  const { _ } = prefsGettext;

  // Create the preset combo row
  const comboRow = createEnumComboRow(
    group,
    settings,
    presetSettingsKey,
    configs,
    rowConfig,
  );

  // Create the custom entry row
  const entryRow = new Adw.EntryRow({
    title: customRowConfig ? _(customRowConfig.title) : _("Custom Text"),
    text: settings.get_string(customSettingsKey),
    sensitive: customRowConfig?.sensitive !== false,
  });

  group.add(entryRow);

  // Bind custom entry to settings
  settings.bind(
    customSettingsKey,
    entryRow as any,
    "text",
    Gio.SettingsBindFlags.DEFAULT,
  );

  // Find the index of the custom option
  const customIndex = configs.findIndex(
    (config) =>
      "isCustom" in config && (config as CustomPreferenceConfig).isCustom,
  );

  // Update entry row visibility based on preset selection
  const updateCustomEntryVisibility = () => {
    const selectedIndex = comboRow.selected;
    entryRow.visible = selectedIndex === customIndex;
  };

  // Set initial visibility
  updateCustomEntryVisibility();

  // Connect to selection changes
  comboRow.connect("notify::selected", updateCustomEntryVisibility);

  return { comboRow, entryRow };
}

/**
 * Create a combo row with automatic sensitivity binding to another setting.
 *
 * This is useful for creating dependent preferences where one setting controls
 * whether another is enabled (e.g., show weekday depends on show date).
 *
 * @param group - Preferences group to add the row to
 * @param settings - Gio.Settings instance for binding
 * @param settingsKey - The settings key to bind to
 * @param dependencyKey - The settings key that controls sensitivity
 * @param configs - Array of preference configurations
 * @param rowConfig - UI configuration for the row
 * @returns The created combo row
 */
export function createDependentComboRow<T extends BasePreferenceConfig>(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
  settingsKey: SettingsKey | string,
  dependencyKey: SettingsKey | string,
  configs: readonly T[],
  rowConfig: PreferenceRowConfig,
): Adw.ComboRow {
  const comboRow = createEnumComboRow(
    group,
    settings,
    settingsKey,
    configs,
    rowConfig,
  );

  // Bind sensitivity to dependency setting
  settings.bind(
    dependencyKey,
    comboRow as any,
    "sensitive",
    Gio.SettingsBindFlags.DEFAULT,
  );

  return comboRow;
}

/**
 * Create a switch row with automatic sensitivity binding to another setting.
 *
 * @param group - Preferences group to add the row to
 * @param settings - Gio.Settings instance for binding
 * @param settingsKey - The settings key to bind to
 * @param dependencyKey - The settings key that controls sensitivity
 * @param rowConfig - UI configuration for the row
 * @returns The created switch row
 */
export function createDependentSwitchRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
  settingsKey: SettingsKey | string,
  dependencyKey: SettingsKey | string,
  rowConfig: PreferenceRowConfig,
): Adw.SwitchRow {
  const switchRow = createBooleanSwitchRow(
    group,
    settings,
    settingsKey,
    rowConfig,
  );

  // Bind sensitivity to dependency setting
  settings.bind(
    dependencyKey,
    switchRow as any,
    "sensitive",
    Gio.SettingsBindFlags.DEFAULT,
  );

  return switchRow;
}
