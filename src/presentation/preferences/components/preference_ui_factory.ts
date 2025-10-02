/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Automatic UI generation system for preferences.
 *
 * This module provides utilities to automatically create preference UI components
 * from the unified preference configurations. It eliminates boilerplate code and
 * ensures consistency across all preference controls.
 *
 * The system can generate:
 * - Combo rows for enum preferences with automatic binding
 * - Switch rows for boolean preferences
 * - Entry rows with visibility controls for custom options
 * - Complex multi-row configurations (e.g., preset + custom entry)
 *
 * @example
 * ```typescript
 * import { createEnumComboRow, createPresetWithCustomRow } from './preference_ui_factory.js';
 * import { FUZZINESS_CONFIGS, DIVIDER_PRESET_CONFIGS } from '../services/preference_configs.js';
 *
 * // Simple enum combo row
 * const fuzzinessRow = createEnumComboRow(
 *   group,
 *   settings,
 *   SettingsKey.FUZZINESS,
 *   FUZZINESS_CONFIGS,
 *   'Fuzziness',
 *   'Time precision level'
 * );
 *
 * // Preset with custom entry
 * createPresetWithCustomRow(
 *   group,
 *   settings,
 *   SettingsKey.DIVIDER_PRESET,
 *   SettingsKey.CUSTOM_DIVIDER_TEXT,
 *   DIVIDER_PRESET_CONFIGS,
 *   'Divider Preset',
 *   'Choose divider style'
 * );
 * ```
 */

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import SettingsKey from "../../../models/settings_keys.js";
import {
  BasePreferenceConfig,
  CustomPreferenceConfig,
} from "../../../models/preference_types.js";
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
 * Create a combo row for enum-based preferences with automatic binding.
 *
 * This function creates a combo row populated with options from a preference
 * configuration array. It automatically handles:
 * - Creating the string list model from display names with translation
 * - Setting the initial selection from settings
 * - Binding changes back to settings
 * - Internationalization of display text
 *
 * @param group - Preferences group to add the row to
 * @param settings - Gio.Settings instance for binding
 * @param settingsKey - The settings key to bind to
 * @param configs - Array of preference configurations
 * @param rowConfig - UI configuration for the row
 * @returns The created combo row
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

/**
 * Create a switch row for boolean preferences with automatic binding.
 *
 * @param group - Preferences group to add the row to
 * @param settings - Gio.Settings instance for binding
 * @param settingsKey - The settings key to bind to
 * @param rowConfig - UI configuration for the row
 * @returns The created switch row
 */
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
    switchRow,
    "active",
    Gio.SettingsBindFlags.DEFAULT,
  );

  return switchRow;
}

/**
 * Create a preset combo row with accompanying custom entry row.
 *
 * This is specifically designed for preferences that have both preset options
 * and a custom option. When the custom option is selected, an entry row becomes
 * visible for user input.
 *
 * @param group - Preferences group to add rows to
 * @param settings - Gio.Settings instance for binding
 * @param presetSettingsKey - Settings key for the preset selection
 * @param customSettingsKey - Settings key for the custom text
 * @param configs - Array of preference configurations (must include custom option)
 * @param rowConfig - UI configuration for the combo row
 * @param customRowConfig - UI configuration for the custom entry row
 * @returns Object containing both the combo row and entry row
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
    entryRow,
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
    comboRow,
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
    switchRow,
    "sensitive",
    Gio.SettingsBindFlags.DEFAULT,
  );

  return switchRow;
}
