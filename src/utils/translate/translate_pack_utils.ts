// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Utilities for creating translated word packs using gettext functions.
 */

import { createDateConstants } from "../../constants/dates/core.js";
import { createTimeConstants } from "../../constants/times/core.js";
import { LocalizedStrings } from "../../models/localized_strings.js";
import { GettextFunctions } from "../gettext/gettext_utils.js";

/**
 * Create a translated WordPack using the provided gettext functions.
 *
 * @param gettextFns - Gettext functions for translation
 * @returns WordPack with all text translated using the provided functions
 */

export function createTranslatePack(
  gettextFns: GettextFunctions,
): LocalizedStrings {
  const timeConstants = createTimeConstants(gettextFns);
  const dateConstants = createDateConstants(gettextFns);
  return new LocalizedStrings({
    timesFormatOne: timeConstants.timesFormatOne(),
    midnightFormatOne: timeConstants.midnightFormatOne(),
    noonFormatOne: timeConstants.noonFormatOne(),
    timesFormatTwo: timeConstants.timesFormatTwo(),
    midnightFormatTwo: timeConstants.midnightFormatTwo(),
    noonFormatTwo: timeConstants.noonFormatTwo(),
    names: timeConstants.hourNames(),
    days: dateConstants.weekdays(),
    dayNames: dateConstants.weekdayNames(),
    dayOnly: dateConstants.dateOnly(),
    midnight: timeConstants.midnight(),
    noon: timeConstants.noon(),
    daysOfMonth: dateConstants.daysOfMonth(),
  });
}
