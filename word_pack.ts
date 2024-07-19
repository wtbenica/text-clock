/*
 * Copyright (c) 2024 Wesley T Benica
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

/**
 * A class to store the words used to format a time and date as a string.
 *
 * @param {string[]} timesFormatOne - The words for the first time format. 'past-or-to'
 * @param {string} midnightFormatOne - The word for midnight in the first time format.
 * @param {string} noonFormatOne - The word for noon in the first time format.
 * @param {string[]} timesFormatTwo - The words for the second time format. 'hour-oh-minute'
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
}
