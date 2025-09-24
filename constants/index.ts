/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Shared top-level constants used across the extension.
 */

/**
 * Holds the title and subtitle for a preference item
 *
 * @param title: { string } The title of the preference item
 * @param subtitle: {string} The subtitle of the preference item
 */
type PrefsText = {
  title: string;
  subtitle: string;
};

/**
 * The title and subtitles for each preference row
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
};

/**
 * The error messages for the extension
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

import SettingsKey from "../models/settings-keys";

/**
 * Backwards-compatible `SETTINGS` object.
 * Values are sourced from `models/settings-keys.ts` to centralize keys.
 */
export const SETTINGS = {
  SHOW_DATE: SettingsKey.SHOW_DATE,
  FUZZINESS: SettingsKey.FUZZINESS,
  SHOW_WEEKDAY: SettingsKey.SHOW_WEEKDAY,
  TIME_FORMAT: SettingsKey.TIME_FORMAT,
  CLOCK_COLOR: SettingsKey.CLOCK_COLOR,
  DATE_COLOR: SettingsKey.DATE_COLOR,
  DIVIDER_COLOR: SettingsKey.DIVIDER_COLOR,
  DIVIDER_PRESET: SettingsKey.DIVIDER_PRESET,
  CUSTOM_DIVIDER_TEXT: SettingsKey.CUSTOM_DIVIDER_TEXT,
  LAST_SEEN_VERSION: SettingsKey.LAST_SEEN_VERSION,
};

// Map GSettings enum index -> fuzziness minutes.
// Schema enum values (in gschema.xml) are ordered as: 1, 5, 10, 15
export const FUZZINESS_ENUM_MINUTES: number[] = [1, 5, 10, 15];

// Map GSettings enum index -> divider text.
// Schema enum values (in gschema.xml) are ordered as: pipe, bullet, double-pipe, dash, custom
export const DIVIDER_PRESET_TEXTS: string[] = [
  " | ",
  " • ",
  " ‖ ",
  " — ",
  "custom",
];

/**
 * Get the actual divider text based on preset and custom text
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
