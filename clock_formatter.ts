/*
 * Copyright (c) 2024 Wesley Benica
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { WordPack } from "./word_pack.js";
import { Errors } from "./constants/index.js";

/**
 * The time format options for the Text Clock extension
 * @enum {string}
 */
export const TimeFormat = {
  FORMAT_ONE: "format-one",
  FORMAT_TWO: "format-two",
};

/**
 * A class to format a time and date as a string.
 *
 * @param {WordPack} wordPack - The word pack to use for converting time/date to text
 * @param {number} fuzziness - The number of minutes to round to (default 5)
 * @returns {string} The formatted time/date string.
 */
export class ClockFormatter {
  wordPack: WordPack;

  constructor(wordPack: WordPack) {
    this.wordPack = wordPack;
  }

  /**
   * Returns a time/date string formatted as "five past noon" or "five past noon | monday the 1st",
   * depending on whether the date should be shown.
   *
   * @param {Date} date - The current date and time.
   * @param {boolean} showDate - Flag to indicate if the date should be included in the output.
   * @param {boolean} showWeekday - Flag to indicate if the weekday should be included in the output.
   * @param {string} timeFormat - The format of the time string. "format-one" or "hours-and-minute".
   * @returns {string} The formatted time/date string.
   */
  getClockText(
    date: Date,
    showDate: boolean,
    showWeekday: boolean,
    timeFormat: string,
    fuzziness: number,
  ): string {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const minuteBucket = Math.round(minutes / fuzziness) * fuzziness;
    const shouldRoundUp =
      (timeFormat === TimeFormat.FORMAT_ONE && minuteBucket > 30) ||
      minuteBucket === 60;
    const roundedHour = (shouldRoundUp ? hours + 1 : hours) % 24;
    const hourName = this.#getHourName(roundedHour, minuteBucket, timeFormat);
    const time = this.#getTimeString(hourName, minuteBucket, timeFormat);
    const displayDate = showDate
      ? ` | ${this.#getDisplayedDate(date, minuteBucket, showWeekday)}`
      : "";

    return time + displayDate;
  }

  /**
   * Returns the name of the hour suitable for display, considering special cases like "midnight" and "noon".
   *
   * @param {number} hour - The hour of the day (0-23).
   * @param {number} minuteBucket - The minute bucket (0-60).
   * @param {string} timeFormat - The format of the time string. "format-one" or "hours-and-minute".
   * @returns {string} The name of the hour for display.
   */
  #getHourName(hour: number, minuteBucket: number, timeFormat: string): string {
    const isTopOfTheHour = this.#isTopOfTheHour(minuteBucket);
    const isMidnight = hour === 0;
    const isNoon = hour === 12;

    if (isMidnight) {
      if (this.#isTopOfTheHour(minuteBucket)) {
        return this.wordPack.midnight;
      } else if (timeFormat === TimeFormat.FORMAT_ONE) {
        return this.wordPack.midnightFormatOne;
      } else {
        return this.wordPack.midnightFormatTwo;
      }
    } else if (isNoon) {
      if (isTopOfTheHour) {
        return this.wordPack.noon;
      } else if (timeFormat === TimeFormat.FORMAT_ONE) {
        return this.wordPack.noonFormatOne;
      } else {
        return this.wordPack.noonFormatTwo;
      }
    } else {
      return this.wordPack.names[hour];
    }
  }

  /**
   * Returns the time string for the given hour name and minute bucket.
   *
   * @param {string} hourName - The name of the hour.
   * @param {number} minuteBucket - The minute bucket (0-11).
   * @returns {string} The time string.
   */
  #getTimeString(
    hourName: string,
    minuteBucket: number,
    timeFormat: string,
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
    } catch (error) {
      try {
        return template.replace("%s", arg);
      } catch (error2: any) {
        logError(error2, Errors.ERROR_UNABLE_TO_FORMAT_DATE_STRING);
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
