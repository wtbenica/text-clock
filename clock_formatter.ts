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

/**
 * A class to format a time and date as a string.
 *
 * @param {WordPack} wordPack - The word pack to use for converting time/date to text
 * @param {number} fuzziness - The number of minutes to round to (default 5)
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
   * @returns {string} The formatted time/date string.
   */
  getClockText(date: Date, showDate: boolean) {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const minuteBucket =
      Math.round(minutes / this.fuzziness!) * this.fuzziness!;
    const roundedHour = minuteBucket > 30 ? hours + 1 : hours;
    const adjustedHour = roundedHour === 12 ? 12 : roundedHour % 12;
    const hourName = this.#getHourName(adjustedHour, minuteBucket);
    const time = this.#getTimeString(hourName, minuteBucket);
    const displayDate = showDate
      ? ` | ${this.#getDisplayedDate(date, minuteBucket)}`
      : "";

    console.log(`getClockText(${date}, ${showDate}) => ${time + displayDate}`);
    console.log(`minutes: ${minutes}`);
    console.log(`hours: ${hours}`);
    console.log(`fuzziness: ${this.fuzziness} ${typeof this.fuzziness}`);
    console.log(`minuteBucket: ${minuteBucket}`);
    console.log(`roundedHour: ${roundedHour}`);
    console.log(`adjustedHour: ${adjustedHour}`);
    console.log(`hourName: ${hourName}`);
    console.log(`time: ${time}`);
    console.log(`displayDate: ${displayDate}`);

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
  #getTimeString(hourName: string, minuteBucket: number) {
    if (
      (minuteBucket === 0 || minuteBucket === 60) &&
      (hourName === this.wordPack!.midnight || hourName === this.wordPack!.noon)
    ) {
      return hourName;
    }

    try {
      return this.wordPack!.times[minuteBucket].format(hourName);
    } catch (error) {
      console.log("(1) Unable to format time string ", error);
      try {
        return this.wordPack!.times[minuteBucket].replace("%s", hourName);
      } catch (error2) {
        console.log("(2) Unable to format time string ", error2);
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
  #getDisplayedDate(date: Date, minuteBucket: number) {
    const extraDay = date.getHours() === 23 && minuteBucket === 60;
    const adjustedDate = new Date(date);
    if (extraDay) {
      adjustedDate.setDate(date.getDate() + 1);
    }
    const dayOfWeek = this.wordPack!.days[adjustedDate.getDay()];
    const dayOfMonth = adjustedDate.getDate();
    const ordinal = this.#getOrdinal(dayOfMonth);

    try {
      return dayOfWeek.format(ordinal);
    } catch (error) {
      try {
        return dayOfWeek.replace("%s", ordinal);
      } catch (error2) {
        console.log("Unable to format date string ", error2);
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
