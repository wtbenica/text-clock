/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export * from "./core.js";
export {
  daysOfMonth as daysOfMonthExtension,
  dateOnly as dateOnlyExtension,
  weekdays as weekdaysExtension,
} from "./extension.js";
export {
  daysOfMonth as daysOfMonthPrefs,
  dateOnly as dateOnlyPrefs,
  weekdays as weekdaysPrefs,
} from "./prefs.js";
