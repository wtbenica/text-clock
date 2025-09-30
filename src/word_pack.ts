/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TimeFormat } from "./core/clock_formatter.js";

/**
 * Container for localized text strings used throughout the text-clock extension.
 *
 * WordPack centralizes all the localized words and phrases needed to display
 * human-readable time and date text. It supports multiple time formats and
 * provides access to hour names, month names, day names, and specialized
 * phrases for midnight, noon, and date formatting.
 *
 * The class is designed to work with the extension's localization system,
 * containing pre-translated text that varies by user locale and context
 * (extension runtime vs preferences window).
 *
 * @example
 * ```typescript
 * const wordPack = new WordPack({
 *   timesFormatOne: ["one o'clock", "one past one", ...],
 *   midnightFormatOne: "midnight",
 *   noonFormatOne: "noon",
 *   timesFormatTwo: ["one o'clock", "one past one", ...],
 *   midnightFormatTwo: "midnight",
 *   noonFormatTwo: "noon",
 *   names: ["January", "February", ...],
 *   days: ["Monday the %s", "Tuesday the %s", ...],
 *   dayOnly: "the %s",
 *   midnight: "midnight",
 *   noon: "noon",
 *   daysOfMonth: ["first", "second", ...]
 * });
 *
 * const times = wordPack.getTimes(TimeFormat.FORMAT_ONE);
 * console.log(times[0]); // "one o'clock"
 * ```
 */
export class WordPack {
  /** Time expressions for format one (e.g., "five past two") */
  timesFormatOne: string[];

  /** Midnight expression for format one */
  midnightFormatOne: string;

  /** Noon expression for format one */
  noonFormatOne: string;

  /** Time expressions for format two (alternative phrasing) */
  timesFormatTwo: string[];

  /** Midnight expression for format two */
  midnightFormatTwo: string;

  /** Noon expression for format two */
  noonFormatTwo: string;

  /** Month names (e.g., ["January", "February", ...]) */
  names: string[];

  /** Weekday names with date placeholders (e.g., "Monday the %s") */
  days: string[];

  /**
   * Plain weekday names for standalone weekday display (e.g., "Monday").
   * Translators should provide these in order Sunday..Saturday.
   */
  dayNames: string[];

  /** Date-only format template (e.g., "the %s") */
  dayOnly: string;

  /** Generic midnight expression */
  midnight: string;

  /** Generic noon expression */
  noon: string;

  /** Ordinal day names (e.g., ["first", "second", "third", ...]) */
  daysOfMonth: string[];

  /**
   * Creates a new WordPack with localized text strings.
   *
   * @param config - Configuration object containing all localized text strings for the extension.
   * @param config.timesFormatOne - Array of 60 time expressions for format one (e.g., "five past two").
   * @param config.midnightFormatOne - Midnight expression for format one (e.g., "midnight").
   * @param config.noonFormatOne - Noon expression for format one (e.g., "noon").
   * @param config.timesFormatTwo - Array of 60 time expressions for format two (alternative phrasing).
   * @param config.midnightFormatTwo - Midnight expression for format two.
   * @param config.noonFormatTwo - Noon expression for format two.
   * @param config.names - Array of 12 month names (e.g., ["January", "February", ...]).
   * @param config.days - Array of 7 weekday templates with date placeholders (e.g., "Monday the %s").
   * @param config.dayOnly - Date-only format template (e.g., "the %s").
   * @param config.midnight - Generic midnight expression.
   * @param config.noon - Generic noon expression.
   * @param config.daysOfMonth - Array of 31 ordinal day names (e.g., ["first", "second", ...]).
   *
   * @example
   * ```typescript
   * const wordPack = new WordPack({
   *   timesFormatOne: ["one o'clock", "one past one", ...],
   *   midnightFormatOne: "midnight",
   *   noonFormatOne: "noon",
   *   timesFormatTwo: ["one o'clock", "one past one", ...],
   *   midnightFormatTwo: "midnight",
   *   noonFormatTwo: "noon",
   *   names: ["January", "February", ...],
   *   days: ["Monday the %s", "Tuesday the %s", ...],
   *   dayOnly: "the %s",
   *   midnight: "midnight",
   *   noon: "noon",
   *   daysOfMonth: ["first", "second", ...]
   * });
   * ```
   */
  constructor({
    timesFormatOne,
    midnightFormatOne,
    noonFormatOne,
    timesFormatTwo,
    midnightFormatTwo,
    noonFormatTwo,
    names,
    days,
    dayNames,
    dayOnly,
    midnight,
    noon,
    daysOfMonth,
  }: {
    timesFormatOne: string[];
    midnightFormatOne: string;
    noonFormatOne: string;
    timesFormatTwo: string[];
    midnightFormatTwo: string;
    noonFormatTwo: string;
    names: string[];
    days: string[];
    dayNames: string[];
    dayOnly: string;
    midnight: string;
    noon: string;
    daysOfMonth: string[];
  }) {
    this.timesFormatOne = timesFormatOne;
    this.midnightFormatOne = midnightFormatOne;
    this.noonFormatOne = noonFormatOne;
    this.timesFormatTwo = timesFormatTwo;
    this.midnightFormatTwo = midnightFormatTwo;
    this.noonFormatTwo = noonFormatTwo;
    this.names = names;
    this.days = days;
    this.dayNames = dayNames;
    this.dayOnly = dayOnly;
    this.midnight = midnight;
    this.noon = noon;
    this.daysOfMonth = daysOfMonth;
  }

  /**
   * Retrieves the appropriate time expressions array for the given format.
   *
   * Returns an array of 60 localized time expressions, one for each minute,
   * corresponding to the specified time format.
   *
   * @param timeFormat - The time format identifier (TimeFormat enum).
   *   Use TimeFormat.FORMAT_ONE for the primary phrasing, or TimeFormat.FORMAT_TWO for alternative phrasing.
   * @returns {string[]} Array of 60 time expressions corresponding to minutes 0-59.
   *
   * @example
   * ```typescript
   * const times = wordPack.getTimes(TimeFormat.FORMAT_ONE);
   * console.log(times[15]); // "quarter past two"
   * ```
   */
  getTimes(timeFormat: TimeFormat): string[] {
    return timeFormat === TimeFormat.FORMAT_TWO
      ? this.timesFormatTwo
      : this.timesFormatOne;
  }
}
