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
 * @param {string[]} times - A list of strings that tells time using minutes and hours ("five past noon")
 * @param {string[]} names - A list of strings that tells the hour ("one", "five", "noon")
 * @param {string[]} days - A list of strings that tells the day of the week ("monday")
 * @param {string} midnight - The word for midnight
 * @param {string} noon - The word for noon
 * @param {string[]} daysOfMonth - A list of strings that tells the date ("first", "second", "third")
 */
export class WordPack {
  times: string[];
  names: string[];
  days: string[];
  midnight: string;
  noon: string;
  daysOfMonth: string[];

  constructor({
    times,
    names,
    days,
    midnight,
    noon,
    daysOfMonth,
  }: {
    times: string[];
    names: string[];
    days: string[];
    midnight: string;
    noon: string;
    daysOfMonth: string[];
  }) {
    this.times = times;
    this.names = names;
    this.days = days;
    this.midnight = midnight;
    this.noon = noon;
    this.daysOfMonth = daysOfMonth;
  }
}
