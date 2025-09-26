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
 *   // ... other properties
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
   * @param config - Configuration object containing all localized text
   * @param config.timesFormatOne - Time expressions for format one (60 entries for each minute)
   * @param config.midnightFormatOne - Midnight expression for format one
   * @param config.noonFormatOne - Noon expression for format one
   * @param config.timesFormatTwo - Time expressions for format two (60 entries)
   * @param config.midnightFormatTwo - Midnight expression for format two
   * @param config.noonFormatTwo - Noon expression for format two
   * @param config.names - Month names (12 entries)
   * @param config.days - Weekday templates with date placeholder (7 entries)
   * @param config.dayOnly - Date-only template
   * @param config.midnight - Generic midnight expression
   * @param config.noon - Generic noon expression
   * @param config.daysOfMonth - Ordinal day names (31 entries: "first" through "thirty first")
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
    this.dayOnly = dayOnly;
    this.midnight = midnight;
    this.noon = noon;
    this.daysOfMonth = daysOfMonth;
  }

  /**
   * Retrieves the appropriate time expressions array for the given format.
   *
   * The time expressions are arrays of 60 strings, one for each minute of an hour.
   * Each format provides different phrasing styles for the same time concepts.
   *
   * @param timeFormat - The time format identifier (FORMAT_ONE or FORMAT_TWO)
   * @returns Array of 60 time expressions corresponding to minutes 0-59
   *
   * @example
   * ```typescript
   * const times = wordPack.getTimes(TimeFormat.FORMAT_ONE);
   * console.log(times[0]);  // "one o'clock" (for X:00)
   * console.log(times[5]);  // "five past one" (for X:05)
   * console.log(times[30]); // "half past one" (for X:30)
   * ```
   */
  getTimes(timeFormat: string): string[] {
    return timeFormat === TimeFormat.FORMAT_TWO
      ? this.timesFormatTwo
      : this.timesFormatOne;
  }
}
