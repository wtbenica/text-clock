/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Centralized, type-safe constants for extension settings keys.
 *
 * This enum provides strongly-typed constants for all GSettings keys used
 * throughout the text-clock extension. Using these constants instead of
 * string literals improves code maintainability, enables IDE autocompletion,
 * and helps prevent typos in settings key names.
 *
 * The keys correspond directly to those defined in the extension's GSettings
 * schema (org.gnome.shell.extensions.text-clock.gschema.xml).
 *
 * @example
 * ```typescript
 * import SettingsKey from './models/settings_keys.js';
 *
 * // Type-safe settings access
 * const showDate = settings.get_boolean(SettingsKey.SHOW_DATE);
 * settings.set_string(SettingsKey.CLOCK_COLOR, '#3584E4');
 *
 * // Settings manager integration
 * settingsManager.subscribe(SettingsKey.COLOR_MODE, (newMode) => {
 *   updateColorScheme(newMode);
 * });
 *
 * // Property binding
 * settingsManager.bindProperty(
 *   SettingsKey.SHOW_WEEKDAY,
 *   checkboxWidget,
 *   'active'
 * );
 * ```
 */

/**
 * Enumeration of all settings keys used by the text-clock extension.
 *
 * Each value corresponds to a key defined in the GSettings schema.
 * The keys are organized into logical groups: display options,
 * time formatting, color configuration, and internal state.
 */
export const enum SettingsKey {
  // Display Options
  /** Controls whether to display date alongside time (boolean) */
  SHOW_DATE = "show-date",

  /** Controls whether to include weekday in date display (boolean) */
  SHOW_WEEKDAY = "show-weekday",

  /** Time format identifier for text generation (string enum) */
  TIME_FORMAT = "time-format",

  /** Time precision/fuzziness level (enum: 0=1min, 1=5min, 2=10min, 3=15min) */
  FUZZINESS = "fuzziness",

  // Color Configuration
  /** Overall color mode (enum: 0=default, 1=accent, 2=custom) */
  COLOR_MODE = "color-mode",

  /** Accent color variation style when in accent mode (enum) */
  ACCENT_COLOR_STYLE = "accent-color-style",

  /** Custom hex color for time text (string) */
  CLOCK_COLOR = "clock-color",

  /** Custom hex color for date text (string) */
  DATE_COLOR = "date-color",

  /** Custom hex color for divider text (string) */
  DIVIDER_COLOR = "divider-color",

  // Per-Element Accent Overrides (Custom Mode)
  /** Whether time text should use accent color in custom mode (boolean) */
  CLOCK_USE_ACCENT = "clock-use-accent",

  /** Whether date text should use accent color in custom mode (boolean) */
  DATE_USE_ACCENT = "date-use-accent",

  /** Whether divider should use accent color in custom mode (boolean) */
  DIVIDER_USE_ACCENT = "divider-use-accent",

  // Divider Configuration
  /** Preset divider style (enum: different separator symbols) */
  DIVIDER_PRESET = "divider-preset",

  /** Custom divider text when preset is set to custom (string) */
  CUSTOM_DIVIDER_TEXT = "custom-divider-text",

  // Internal State
  /** Last seen extension version for update notifications (string) */
  LAST_SEEN_VERSION = "last-seen-version",
  /** Temporarily saved accent style when date/weekday is hidden (nullable enum index) */
  ACCENT_STYLE_SAVED_BEFORE_HIDE = "accent-style-saved-before-hide",
}

export default SettingsKey;
