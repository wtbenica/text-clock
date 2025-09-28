// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Shared top-level constants used across theimport SettingsKey from "../../domain/models/settings_keys.js";Text Clock extension.
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

import SettingsKey from "../../domain/models/settings_keys.js";

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
 * Re-export divider text function for backward compatibility.
 *
 * @param presetIndex - GSettings enum index for divider preset
 * @param customText - Custom divider text when preset is "custom"
 * @returns The actual divider text to display
 */
export { getDividerText } from "../../application/services/preference_configs.js";
