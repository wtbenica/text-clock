// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Date constants for the preferences UI context.
 *
 * This file exists separately from core.ts because GNOME Shell extensions
 * have different translation contexts for the main extension vs preferences.
 * This file uses prefsGettext for translations that appear in the settings
 * dialog, while extension.ts uses extensionGettext for the main clock display.
 *
 * Both files call the same createDateConstants() function but with different
 * gettext implementations to ensure proper localization in each context.
 */

import { prefsGettext } from "../../utils/gettext/gettext_utils_prefs.js";
import { createDateConstants } from "../dates/core.js";

const fns = prefsGettext;
export const { dateOnly, weekdays, daysOfMonth } = createDateConstants(fns);
