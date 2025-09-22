/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { WordPack } from "./word_pack.js";
import { logErr, validateDate } from "./utils/error-utils.js";

/**
 * The time format options for the Text Clock extension
 * @enum {string}
 */
export enum TimeFormat {
  FORMAT_ONE = "format-one",
  FORMAT_TWO = "format-two",
}

/**
 * Fuzziness options for time rounding in the Text Clock extension
 * @enum {number}
 */
export enum Fuzziness {
  ONE_MINUTE = 1,
  FIVE_MINUTES = 5,
  TEN_MINUTES = 10,
  FIFTEEN_MINUTES = 15,
}

/**
 * A class to format a time and date as a string.
 *
 * This class provides functionality to convert Date objects into human-readable
 * time strings like "five past noon" or "quarter to three", with optional date
 * information like "five past noon | Monday the 1st".
 *
 * @constructor
 * @param {WordPack} wordPack - The word pack containing localized strings for time/date formatting
 */
export class ClockFormatter {
  wordPack: WordPack;
  divider: string;
  #cachedHourNames: Map<string, string> = new Map();

  constructor(wordPack: WordPack, divider: string = " | ") {
    this.wordPack = wordPack;
    this.divider = divider;
  }

  /**
   * Returns a time/date string formatted as "five past noon" or "five past noon | monday the 1st",
   * depending on whether the date should be shown.
   *
   * @param {Date} date - The current date and time.
   * @param {boolean} showDate - Flag to indicate if the date should be included in the output.
   * @param {boolean} showWeekday - Flag to indicate if the weekday should be included in the output.
   * @param {TimeFormat} timeFormat - The format of the time string.
   * @param {Fuzziness} fuzziness - The number of minutes to round to.
   * @returns {string} The formatted time/date string.
   */
  getClockText(
    date: Date,
    showDate: boolean,
    showWeekday: boolean,
    timeFormat: TimeFormat,
    fuzziness: Fuzziness,
  ): string {
    const parts = this.getClockParts(
      date,
      showDate,
      showWeekday,
      timeFormat,
      fuzziness,
    );
    return parts.time + parts.divider + parts.date;
  }

  /**
   * Returns the clock parts: time, divider, date.
   *
   * @param {Date} date - The current date and time.
   * @param {boolean} showDate - Flag to indicate if the date should be included in the output.
   * @param {boolean} showWeekday - Flag to indicate if the weekday should be included in the output.
   * @param {TimeFormat} timeFormat - The format of the time string.
   * @param {Fuzziness} fuzziness - The number of minutes to round to.
   * @returns {object} Object with time, divider, date strings.
   */
  getClockParts(
    date: Date,
    showDate: boolean,
    showWeekday: boolean,
    timeFormat: TimeFormat,
    fuzziness: Fuzziness,
  ): { time: string; divider: string; date: string } {
    // Validate inputs
    validateDate(date, "ClockFormatter.getClockParts");
    if (fuzziness <= 0) {
      throw new Error("Fuzziness must be a positive number");
    }

    const minutes = date.getMinutes();
    const hours = date.getHours();
    const minuteBucket = Math.round(minutes / fuzziness) * fuzziness;
    const shouldRoundUp =
      (timeFormat === TimeFormat.FORMAT_ONE && minuteBucket > 30) ||
      minuteBucket === 60;
    const roundedHour = (shouldRoundUp ? hours + 1 : hours) % 24;
    const hourName = this.#getHourName(roundedHour, minuteBucket, timeFormat);
    const time = this.#getTimeString(hourName, minuteBucket, timeFormat);
    const divider = showDate ? this.divider : "";
    const dateStr = showDate
      ? this.#getDisplayedDate(date, minuteBucket, showWeekday)
      : "";

    return { time, divider, date: dateStr };
  }

  /**
   * Returns the name of the hour suitable for display, considering special cases like "midnight" and "noon".
   *
   * @param {number} hour - The hour of the day (0-23).
   * @param {number} minuteBucket - The minute bucket (0-60).
   * @param {TimeFormat} timeFormat - The format of the time string.
   * @returns {string} The name of the hour for display.
   */
  #getHourName(
    hour: number,
    minuteBucket: number,
    timeFormat: TimeFormat,
  ): string {
    // Create cache key
    const cacheKey = `${hour}-${minuteBucket}-${timeFormat}`;

    // Check cache first
    if (this.#cachedHourNames.has(cacheKey)) {
      return this.#cachedHourNames.get(cacheKey)!;
    }

    const isTopOfTheHour = this.#isTopOfTheHour(minuteBucket);
    const isMidnight = hour === 0;
    const isNoon = hour === 12;

    let hourName: string;
    if (isMidnight) {
      if (this.#isTopOfTheHour(minuteBucket)) {
        hourName = this.wordPack.midnight;
      } else if (timeFormat === TimeFormat.FORMAT_ONE) {
        hourName = this.wordPack.midnightFormatOne;
      } else {
        hourName = this.wordPack.midnightFormatTwo;
      }
    } else if (isNoon) {
      if (isTopOfTheHour) {
        hourName = this.wordPack.noon;
      } else if (timeFormat === TimeFormat.FORMAT_ONE) {
        hourName = this.wordPack.noonFormatOne;
      } else {
        hourName = this.wordPack.noonFormatTwo;
      }
    } else {
      hourName = this.wordPack.names[hour];
    }

    // Cache the result
    this.#cachedHourNames.set(cacheKey, hourName);
    return hourName;
  }

  /**
   * Returns the time string for the given hour name and minute bucket.
   *
   * @param {string} hourName - The name of the hour.
   * @param {number} minuteBucket - The minute bucket (0-11).
   * @param {TimeFormat} timeFormat - The format of the time string.
   * @returns {string} The time string.
   */
  #getTimeString(
    hourName: string,
    minuteBucket: number,
    timeFormat: TimeFormat,
  ): string {
    const twelves = [
      this.wordPack.names[0],
      this.wordPack.names[12],
      this.wordPack.midnight,
      this.wordPack.noon,
    ];

    const isNoonOrMidnightExactly: boolean =
      this.#isTopOfTheHour(minuteBucket) && twelves.includes(hourName);

    if (isNoonOrMidnightExactly) {
      return hourName;
    }

    const times: string[] = this.wordPack.getTimes(timeFormat);

    return this.#formatString(times[minuteBucket], hourName);
  }

  /**
   * Returns whether the given minute bucket is at the top of the hour (0 or 60).
   *
   * @param {number} minuteBucket - The minute bucket (0-60).
   * @returns {boolean} True if the minute bucket is at the top of the hour, false otherwise.
   */
  #isTopOfTheHour(minuteBucket: number): boolean {
    return minuteBucket === 0 || minuteBucket === 60;
  }

  /**
   * Formats the current date as a string like "monday the 1st", adjusting the date based if the time will be rounded up to midnight (the next day).
   *
   * @param {Date} date - The date to format.
   * @param {number} minuteBucket - The minute bucket (0-12).
   * @returns {string} The formatted date string.
   */
  #getDisplayedDate(
    date: Date,
    minuteBucket: number,
    showWeekday: boolean,
  ): string {
    const isNextDay = date.getHours() === 23 && minuteBucket === 60;
    const adjustedDate = new Date(date);
    if (isNextDay) {
      adjustedDate.setDate(date.getDate() + 1);
    }

    const weekdayString = showWeekday
      ? this.wordPack.days[adjustedDate.getDay()]
      : this.wordPack.dayOnly;

    const dateString = this.#getDateString(adjustedDate.getDate());

    return this.#formatString(weekdayString, dateString);
  }

  /**
   * Attempts to format the given string template with the given arguments.
   *
   * If the format method is not available, it will attempt to replace the first instance of "%s" with the argument.
   *
   * @param {string} template - The template string to format.
   * @param {string} arg - The argument to insert into the template.
   * @returns {string} The formatted string.
   */
  #formatString(template: string, arg: string): string {
    try {
      return template.format(arg);
    } catch {
      try {
        return template.replace("%s", arg);
      } catch (error2: any) {
        logErr(error2, "Failed to format date string template");
      }
    }
    return template;
  }

  /**
   * Returns the date string for the given number.
   *
   * @param {number} n - The number to convert to an ordinal.
   * @returns {string} The ordinal string.
   */
  #getDateString(n: number): string {
    return this.wordPack.daysOfMonth[n - 1];
  }
}
