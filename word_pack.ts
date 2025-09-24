/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TimeFormat } from "./core/clock_formatter.js";

/**
 * A class to store the words used to format a time and date as a string.
 *
 * @param {string[]} timesFormatOne - The words for the first time format. 'format-one'
 * @param {string} midnightFormatOne - The word for midnight in the first time format.
 * @param {string} noonFormatOne - The word for noon in the first time format.
 * @param {string[]} timesFormatTwo - The words for the second time format. 'format-two'
 * @param {string} midnightFormatTwo - The word for midnight in the second time format.
 * @param {string} noonFormatTwo - The word for noon in the second time format.
 * @param {string[]} names - The names of the months.
 * @param {string[]} days - The names of the days of the week.
 * @param {string} dayOnly - The word for the day of the month.
 * @param {string} midnight - The word for midnight.
 * @param {string} noon - The word for noon.
 * @param {string[]} daysOfMonth - The suffixes for the days of the month.
 */
export class WordPack {
  timesFormatOne: string[];
  midnightFormatOne: string;
  noonFormatOne: string;
  timesFormatTwo: string[];
  midnightFormatTwo: string;
  noonFormatTwo;
  names: string[];
  days: string[];
  dayOnly: string;
  midnight: string;
  noon: string;
  daysOfMonth: string[];

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
   * Returns the correct times for the given time format
   *
   * @param {string} timeFormat - The time format.
   */
  getTimes(timeFormat: string): string[] {
    return timeFormat === TimeFormat.FORMAT_TWO
      ? this.timesFormatTwo
      : this.timesFormatOne;
  }
}
