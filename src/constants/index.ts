/**
 * Shared top-level constants used across the Text Clock extension.
 *
 * This module centralizes all extension constants including preference text,
 * error messages, settings key mappings, and enum value mappings. It provides
 * a single source of truth for string literals, configuration arrays, and
 * type definitions used throughout the extension.
 *
 * The constants support:
 * - Preference UI text and descriptions
 * - Centralized error message definitions
 * - GSettings enum index to value mappings
 * - Color mode and accent style configurations
 * - Backwards-compatible settings key access
 *
 * @example
 * ```typescript
 * import { PrefItems, Errors, SETTINGS, getDividerText } from './constants/index.js';
 *
 * // Preference text
 * const showDateTitle = PrefItems.SHOW_DATE.title; // "Show Date"
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
 * Type definition for preference item text content.
 *
 * Defines the structure for preference row text including both the main title
 * and descriptive subtitle shown in the preferences UI.
 */
type PrefsText = {
  /** Main title displayed prominently for the preference item */
  title: string;

  /** Descriptive subtitle explaining the preference's function */
  subtitle: string;
};

/**
 * Text content for preference items in the extension settings UI.
 *
 * Provides human-readable titles and descriptions for each configurable
 * preference. Used by the preferences UI to generate consistent, descriptive
 * labels for settings rows.
 */
export const PrefItems: Record<string, PrefsText> = {
  SHOW_DATE: {
    title: "Show Date",
    subtitle: "Show the date in the clock",
  },
  SHOW_WEEKDAY: {
    title: "Show Weekday",
    subtitle: "Show the weekday as part of the date",
  },
  TIME_FORMAT: {
    title: "Time Format",
    subtitle: "Write the time out in this format",
  },
  FUZZINESS: {
    title: "Fuzziness",
    subtitle: "Round the minutes to the nearest multiple of this number",
  },
  COLOR_MODE: {
    title: "Color Mode",
    subtitle: "Choose how to color the clock text",
  },
};

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
 * Maps GSettings enum indices to fuzziness values in minutes.
 *
 * The GSettings schema defines fuzziness as an enum with indices 0-3
 * corresponding to 1, 5, 10, and 15 minute rounding intervals.
 * This array provides the mapping from enum index to actual minute values.
 */
export const FUZZINESS_ENUM_MINUTES: number[] = [1, 5, 10, 15];

/**
 * Maps GSettings enum indices to divider text presets.
 *
 * The GSettings schema defines divider presets as an enum with indices 0-4.
 * This array provides the actual text strings for each preset, with index 4
 * representing the "custom" option (handled separately).
 */
export const DIVIDER_PRESET_TEXTS: string[] = [
  " | ",
  " • ",
  " ‖ ",
  " — ",
  "custom",
];

/**
 * Maps GSettings enum indices to color mode names.
 *
 * The GSettings schema defines color modes as an enum with indices 0-2.
 * This array provides human-readable names for each color mode used in the UI.
 */
export const COLOR_MODE_NAMES: string[] = [
  "Default",
  "Accent Color",
  "Custom Colors",
];

// Import accent style configuration to ensure consistency
import { ACCENT_STYLE_CONFIGS } from "../services/accent_style_config.js";

/**
 * Maps GSettings enum indices to accent color style names and descriptions.
 *
 * These arrays are dynamically generated from the accent style configuration
 * to ensure consistency between the settings schema and the actual style
 * implementations. Used for populating UI dropdowns and descriptions.
 */
export const ACCENT_COLOR_STYLE_NAMES: string[] = ACCENT_STYLE_CONFIGS.map(
  (config) => config.name,
);
export const ACCENT_COLOR_STYLE_DESCRIPTIONS: string[] =
  ACCENT_STYLE_CONFIGS.map((config) => config.description);

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
  if (presetIndex === 4) {
    // custom
    return customText;
  }
  return DIVIDER_PRESET_TEXTS[presetIndex] || " • ";
}
