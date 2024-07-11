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
import { Errors } from "./constants_en.js";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

export const TimeFormat = {
  PAST_OR_TO: "past-or-to",
  HOURS_MINUTES: "hour-oh-minute",
};

/**
 * A class to format a time and date as a string.
 *
 * @param {WordPack} wordPack - The word pack to use for converting time/date to text
 * @param {number} fuzziness - The number of minutes to round to (default 5)
 * @param {boolean} showWeekday - Whether to show the weekday in the output (default true)
 * @returns {string} The formatted time/date string.
 */
export class ClockFormatter {
  wordPack?: WordPack;
  fuzziness?: number;

  constructor(wordPack: WordPack, fuzziness: number = 5) {
    this.wordPack = wordPack;
    this.fuzziness = fuzziness;
  }

  /**
   * Returns a time/date string formatted as "five past noon" or "five past noon | monday the 1st",
   * depending on whether the date should be shown.
   *
   * @param {Date} date - The current date and time.
   * @param {boolean} showDate - Flag to indicate if the date should be included in the output.
   * @param {boolean} showWeekday - Flag to indicate if the weekday should be included in the output.
   * @param {string} timeFormat - The format of the time string. "past-or-to" or "hours-and-minute".
   * @returns {string} The formatted time/date string.
   */
  getClockText(
    date: Date,
    showDate: boolean,
    showWeekday: boolean,
    timeFormat: string
  ) {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const minuteBucket =
      Math.round(minutes / this.fuzziness!) * this.fuzziness!;
    const roundedHour =
      timeFormat === TimeFormat.PAST_OR_TO && minuteBucket > 30
        ? hours + 1
        : hours;
    const adjustedHour = roundedHour === 12 ? 12 : roundedHour % 12;
    const hourName = this.#getHourName(adjustedHour, minuteBucket);
    const time = this.#getTimeString(hourName, minuteBucket, timeFormat);
    const displayDate = showDate
      ? ` | ${this.#getDisplayedDate(date, minuteBucket, showWeekday!)}`
      : "";

    return time + displayDate;
  }

  /**
   * Returns the name of the hour suitable for display, considering special cases like "midnight" and "noon".
   *
   * @param {number} displayHour - The hour to be displayed, adjusted for context (0-12).
   * @returns {string} The name of the hour for display.
   */
  #getHourName(hour: number, minuteBucket: number) {
    if (minuteBucket === 0 || minuteBucket === 12) {
      if (hour === 0) {
        return this.wordPack!.midnight;
      } else if (hour === 12) {
        return this.wordPack!.noon;
      }
    }

    return this.wordPack!.names[hour];
  }

  /**
   * Returns the time string for the given hour name and minute bucket.
   *
   * @param {string} hourName - The name of the hour.
   * @param {number} minuteBucket - The minute bucket (0-11).
   * @returns {string} The time string.
   */
  #getTimeString(hourName: string, minuteBucket: number, timeFormat: string) {
    if (
      (minuteBucket === 0 || minuteBucket === 60) &&
      (hourName === this.wordPack!.midnight || hourName === this.wordPack!.noon)
    ) {
      return hourName;
    }

    const times =
      timeFormat === TimeFormat.PAST_OR_TO
        ? this.wordPack!.timesTenToThree
        : timeFormat === TimeFormat.HOURS_MINUTES
        ? this.wordPack!.timesTwoFifty
        : (() => {
            logError(new Error(), `Invalid time format: ${timeFormat}`);
            throw new Error(_(Errors.ERROR_INVALID_TIME_FORMAT));
          })();

    try {
      return times[minuteBucket].format(hourName);
    } catch (error) {
      try {
        return times[minuteBucket].replace("%s", hourName);
      } catch (error2: any) {
        logError(error2, _(Errors.ERROR_UNABLE_TO_FORMAT_TIME_STRING));
      }
    }
  }

  /**
   * Formats the current date as a string like "monday the 1st", adjusting the date based if the time will be rounded up to midnight (the next day).
   *
   * @param {Date} date - The date to format.
   * @param {number} minuteBucket - The minute bucket (0-12).
   * @returns {string} The formatted date string.
   */
  #getDisplayedDate(date: Date, minuteBucket: number, showWeekday: boolean) {
    const extraDay = date.getHours() === 23 && minuteBucket === 60;
    const adjustedDate = new Date(date);
    if (extraDay) {
      adjustedDate.setDate(date.getDate() + 1);
    }
    const dayOfWeek = showWeekday
      ? this.wordPack!.days[adjustedDate.getDay()]
      : this.wordPack!.dayOnly;
    const dayOfMonth = adjustedDate.getDate();
    const ordinal = this.#getOrdinal(dayOfMonth);

    try {
      return dayOfWeek.format(ordinal);
    } catch (error) {
      try {
        return dayOfWeek.replace("%s", ordinal);
      } catch (error2: any) {
        logError(error2, _(Errors.ERROR_UNABLE_TO_FORMAT_DATE_STRING));
      }
    }
    return dayOfWeek.format(ordinal);
  }

  /**
   * Returns the ordinal string for the given number.
   *
   * @param {number} n - The number to convert to an ordinal.
   * @returns {string} The ordinal string.
   */
  #getOrdinal(n: number) {
    return this.wordPack!.daysOfMonth[n - 1];
  }
}
