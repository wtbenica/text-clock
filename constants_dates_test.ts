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

/**
 * The date format for showing the date only, e.g. "the sixth"
 */
export const dateOnly: () => string = () => 'the %s';

/**
 * The date format for showing the day of the week and the date, e.g. "Sunday the fifth"
 */
export const weekdays: () => string[] = () => [
  'sunday the %s',
  'monday the %s',
  'tuesday the %s',
  'wednesday the %s',
  'thursday the %s',
  'friday the %s',
  'saturday the %s',
];

/**
 * The day of the month written out, e.g. "first", "second", "third"
 */
export const daysOfMonth: () => string[] = () => [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
  'eleventh',
  'twelfth',
  'thirteenth',
  'fourteenth',
  'fifteenth',
  'sixteenth',
  'seventeenth',
  'eighteenth',
  'nineteenth',
  'twentieth',
  'twenty first',
  'twenty second',
  'twenty third',
  'twenty fourth',
  'twenty fifth',
  'twenty sixth',
  'twenty seventh',
  'twenty eighth',
  'twenty ninth',
  'thirtieth',
  'thirty first',
];
