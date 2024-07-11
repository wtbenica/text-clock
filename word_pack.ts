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

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

/**
 * A class to store the words used to format a time and date as a string.
 *
 * @param {string[]} timesTenToThree - Times as "M past H" or "M to H", e.g. "five past noon"
 * @param {string[]} timesTwoFifty - Times as "H M", e.g. "noon thirty"
 * @param {string[]} names - A list of strings that tells the hour ("one", "five", "noon")
 * @param {string[]} days - A list of strings that tells the day of the week ("monday")
 * @param {string} midnight - The word for midnight
 * @param {string} noon - The word for noon
 * @param {string} twelve - The word for twelve
 * @param {string[]} daysOfMonth - A list of strings that tells the date ("first", "second", "third")
 */
export class WordPack {
  timesTenToThree: string[];
  timesTwoFifty: string[];
  names: string[];
  days: string[];
  dayOnly: string;
  midnight: string;
  noon: string;
  twelve: string;
  daysOfMonth: string[];

  constructor({
    timesTenToThree,
    timesTwoFifty,
    names,
    days,
    dayOnly,
    midnight,
    noon,
    twelve,
    daysOfMonth,
  }: {
    timesTenToThree: string[];
    timesTwoFifty: string[];
    names: string[];
    days: string[];
    dayOnly: string;
    midnight: string;
    noon: string;
    twelve: string;
    daysOfMonth: string[];
  }) {
    this.timesTenToThree = timesTenToThree;
    this.timesTwoFifty = timesTwoFifty;
    this.names = names;
    this.days = days;
    this.dayOnly = dayOnly;
    this.midnight = midnight;
    this.noon = noon;
    this.twelve = twelve;
    this.daysOfMonth = daysOfMonth;
  }
}
