/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { WordPack } from "../word_pack.js";
import { createTimeConstants } from "../constants/times/core.js";
import { createDateConstants } from "../constants/dates/core.js";
import { GettextFunctions } from "./gettext_utils.js";

/**
 * Creates a word pack containing the strings for telling the time and date
 * Used by both the extension and preferences UI
 *
 * @param gettextFns - The gettext functions to use for translations
 */
export function createTranslatePack(gettextFns: GettextFunctions): WordPack {
  const timeConstants = createTimeConstants(gettextFns);
  const dateConstants = createDateConstants(gettextFns);

  return new WordPack({
    timesFormatOne: timeConstants.timesFormatOne(),
    midnightFormatOne: timeConstants.midnightFormatOne(),
    noonFormatOne: timeConstants.noonFormatOne(),
    timesFormatTwo: timeConstants.timesFormatTwo(),
    midnightFormatTwo: timeConstants.midnightFormatTwo(),
    noonFormatTwo: timeConstants.noonFormatTwo(),
    names: timeConstants.hourNames(),
    days: dateConstants.weekdays(),
    dayOnly: dateConstants.dateOnly(),
    midnight: timeConstants.midnight(),
    noon: timeConstants.noon(),
    daysOfMonth: dateConstants.daysOfMonth(),
  });
}

/**
 * Creates a lazy getter for the translate pack
 * Used to avoid duplicating the TRANSLATE_PACK logic in extension.ts and prefs.ts
 *
 * @param gettextFns - The gettext functions to use for translations
 */
export function createTranslatePackGetter(
  gettextFns: GettextFunctions,
): () => WordPack {
  return () => createTranslatePack(gettextFns);
}
