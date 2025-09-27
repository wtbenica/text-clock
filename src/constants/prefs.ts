// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Page and window title constants for the preferences UI. These are plain
 * English strings and will be localized at the call site using
 * `prefsGettext._(...)`.
 */
export const PAGE_TITLES = {
  GENERAL: "General",
  COLORS: "Colors",
};

export const WINDOW_TITLE = "Text Clock Prefs";

export const PAGE_ICONS = {
  GENERAL: "tc-settings-symbolic",
  COLORS: "preferences-color-symbolic",
};

export const GROUP_TITLES = {
  CLOCK_SETTINGS: "Clock Settings",
  CLOCK_COLORS: "Clock Colors",
};

export const GROUP_DESCRIPTIONS = {
  CLOCK_SETTINGS: "Customize the appearance and behavior of the clock",
  CLOCK_COLORS: "Customize the colors of the clock and date text",
};

export const FUZZINESS_OPTIONS = ["one", "five", "ten", "fifteen"];

export const DIVIDER_PRESET = {
  TITLE: "Divider Preset",
  SUBTITLE: "Choose a preset divider or select custom",
  OPTIONS: ["|", "•", "‖", "—", "Custom"],
  CUSTOM_TITLE: "Custom Divider Text",
};
