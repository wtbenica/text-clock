/**
 * Shared top-level constants used across the Text Clock extension.
 *
 * This module centralizes all extension constants including error messages,
 * settings key mappings, and enum value mappings. It provides a single source
 * of truth for configuration arrays and type definitions used throughout the extension.
 *
 * The constants support:
 * - Centralized error message definitions
 * - GSettings enum index to value mappings
 * - Color mode and accent style configurations
 * - Backwards-compatible settings key access
 *
 * @example
 * ```typescript
 * import { Errors, SETTINGS, getDividerText } from './constants/index.js';
 *
 * // Error messages
 * console.error(Errors.ERROR_INVALID_TIME_FORMAT);
 *
 * // Settings keys
 * const colorModeSetting = SETTINGS.COLOR_MODE; // "color-mode"
 *
 * // Dynamic divider text
 * const divider = getDividerText(0, ''); // " | " (pipe preset)
 * ```
 */

/**
 * Centralized error message definitions for the extension.
 *
 * Provides consistent, descriptive error messages used throughout the
 * extension for logging and debugging. Centralizing error messages
 * ensures consistency and makes them easier to maintain and localize.
 */
export const Errors: Record<string, string> = {
  ERROR_RETRIEVE_DATE_MENU: "Error retrieving date menu",
  ERROR_PLACING_CLOCK_LABEL: "Error placing clock label",
  ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL:
    "Error binding settings to clock label",
  ERROR_INITIALIZING_CLOCK_LABEL: "Error initializing clock label",
  ERROR_UPDATING_CLOCK_LABEL: "Error updating clock label",
  ERROR_COULD_NOT_FIND_CLOCK_DISPLAY_BOX: "Could not find clock display box",
  ERROR_BINDING_SETTINGS_FOR_: "Error binding settings for",
  ERROR_UNABLE_TO_FORMAT_TIME_STRING: "Unable to format time string",
  ERROR_UNABLE_TO_FORMAT_DATE_STRING: "Unable to format date string",
  ERROR_INVALID_TIME_FORMAT: "Invalid time format",
};

import SettingsKey from "../models/settings_keys";
import { getDividerPresetConfig } from "../services/preference_configs";

/**
 * Backwards-compatible settings key mappings.
 *
 * Provides a centralized mapping of setting names to their GSettings keys.
 * Values are sourced from `models/settings_keys.ts` to maintain a single
 * source of truth while preserving backwards compatibility with existing code.
 *
 * @deprecated Consider using SettingsKey enum directly for new code
 */
export const SETTINGS = {
  SHOW_DATE: SettingsKey.SHOW_DATE,
  FUZZINESS: SettingsKey.FUZZINESS,
  SHOW_WEEKDAY: SettingsKey.SHOW_WEEKDAY,
  TIME_FORMAT: SettingsKey.TIME_FORMAT,
  COLOR_MODE: SettingsKey.COLOR_MODE,
  CLOCK_COLOR: SettingsKey.CLOCK_COLOR,
  DATE_COLOR: SettingsKey.DATE_COLOR,
  DIVIDER_COLOR: SettingsKey.DIVIDER_COLOR,
  CLOCK_USE_ACCENT: SettingsKey.CLOCK_USE_ACCENT,
  DATE_USE_ACCENT: SettingsKey.DATE_USE_ACCENT,
  DIVIDER_USE_ACCENT: SettingsKey.DIVIDER_USE_ACCENT,
  DIVIDER_PRESET: SettingsKey.DIVIDER_PRESET,
  CUSTOM_DIVIDER_TEXT: SettingsKey.CUSTOM_DIVIDER_TEXT,
  LAST_SEEN_VERSION: SettingsKey.LAST_SEEN_VERSION,
};

/**
 * Get the actual divider text based on preset index and custom text.
 *
 * Resolves the final divider text to display based on the user's divider
 * preset selection. For preset indices 0-3, returns the corresponding preset
 * text. For index 4 ("custom"), returns the user's custom text string.
 *
 * @param presetIndex - GSettings enum index for the divider preset (0-4)
 * @param customText - User-provided custom divider text (used when presetIndex is 4)
 * @returns The actual divider text to display, with fallback to bullet if invalid
 *
 * @example
 * ```typescript
 * // Preset dividers
 * getDividerText(0, '');           // " | " (pipe)
 * getDividerText(1, '');           // " • " (bullet)
 * getDividerText(2, '');           // " ‖ " (double pipe)
 * getDividerText(3, '');           // " — " (em dash)
 *
 * // Custom divider
 * getDividerText(4, ' → ');        // " → " (custom arrow)
 * getDividerText(4, '');           // '' (empty custom text)
 *
 * // Invalid index (fallback)
 * getDividerText(999, '');         // " • " (bullet fallback)
 * ```
 */
export function getDividerText(
  presetIndex: number,
  customText: string,
): string {
  const config = getDividerPresetConfig(presetIndex);

  // Proper discriminated union: check for the presence of the discriminating property
  if ("isCustom" in config) {
    // This is CustomPreferenceConfig
    return customText;
  }

  // This is ValuePreferenceConfig<string> - has 'value' property
  return config.value;
}
