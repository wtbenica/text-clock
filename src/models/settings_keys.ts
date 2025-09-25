/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Centralized, typed settings keys for the extension.
 * Use these constants instead of raw string literals when reading/writing
 * `Gio.Settings` to improve discoverability and type-safety.
 */

export const enum SettingsKey {
  SHOW_DATE = "show-date",
  SHOW_WEEKDAY = "show-weekday",
  TIME_FORMAT = "time-format",
  FUZZINESS = "fuzziness",
  COLOR_MODE = "color-mode",
  CLOCK_COLOR = "clock-color",
  DATE_COLOR = "date-color",
  DIVIDER_COLOR = "divider-color",
  DIVIDER_PRESET = "divider-preset",
  CUSTOM_DIVIDER_TEXT = "custom-divider-text",
  LAST_SEEN_VERSION = "last-seen-version",
}

export default SettingsKey;
