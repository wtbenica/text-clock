/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TimeFormat } from "../core/clock_formatter.js";

/**
 * Container for localized text strings used in the text-clock extension.
 */
export class LocalizedStrings {
  /** Time expressions for format one */
  timesFormatOne: string[];
  /** Midnight expression for format one */
  midnightFormatOne: string;
  /** Noon expression for format one */
  noonFormatOne: string;
  /** Time expressions for format two */
  timesFormatTwo: string[];
  /** Midnight expression for format two */
  midnightFormatTwo: string;
  /** Noon expression for format two */
  noonFormatTwo: string;
  /** Month names */
  names: string[];
  /** Weekday names with date placeholders */
  days: string[];
  /** Plain weekday names for standalone display */
  dayNames: string[];
  /** Date-only format template */
  dayOnly: string;
  /** Generic midnight expression */
  midnight: string;
  /** Generic noon expression */
  noon: string;
  /** Ordinal day names */
  daysOfMonth: string[];

  /**
   * Creates a new WordPack with localized text strings.
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
   * Get time expressions for the specified format.
   */
  getTimes(timeFormat: TimeFormat): string[] {
    return timeFormat === TimeFormat.FORMAT_TWO
      ? this.timesFormatTwo
      : this.timesFormatOne;
  }
}
