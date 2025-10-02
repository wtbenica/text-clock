// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Time constants for the extension runtime context.
 *
 * This file exists separately from core.ts because GNOME Shell extensions
 * have different translation contexts for the main extension vs preferences.
 * This file uses extensionGettext for translations that appear in the main
 * clock display, while prefs.ts uses prefsGettext for the settings dialog.
 *
 * Both files call the same createTimeConstants() function but with different
 * gettext implementations to ensure proper localization in each context.
 */

import { extensionGettext } from "../../utils/gettext/gettext_utils_ext.js";
import { createTimeConstants } from "../times/core.js";

const fns = extensionGettext;
export const {
  timesFormatOne,
  midnightFormatOne,
  noonFormatOne,
  timesFormatTwo,
  midnightFormatTwo,
  noonFormatTwo,
  hourNames,
  midnight,
  noon,
} = createTimeConstants(fns);
