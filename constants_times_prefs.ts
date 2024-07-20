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

import {
  gettext as _,
  ngettext,
  pgettext as _p,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

/**
 * @returns a list of strings for telling the time as "M past H(%s)" or "M to H(%s)"
 */
export const timesFormatOne: () => string[] = () => [
  _p('format one', "%s o'clock"),
  _p('format one', 'one past %s'),
  _p('format one', 'two past %s'),
  _p('format one', 'three past %s'),
  _p('format one', 'four past %s'),
  _p('format one', 'five past %s'),
  _p('format one', 'six past %s'),
  _p('format one', 'seven past %s'),
  _p('format one', 'eight past %s'),
  _p('format one', 'nine past %s'),
  _p('format one', 'ten past %s'),
  _p('format one', 'eleven past %s'),
  _p('format one', 'twelve past %s'),
  _p('format one', 'thirteen past %s'),
  _p('format one', 'fourteen past %s'),
  _p('format one', 'quarter past %s'),
  _p('format one', 'sixteen past %s'),
  _p('format one', 'seventeen past %s'),
  _p('format one', 'eighteen past %s'),
  _p('format one', 'nineteen past %s'),
  _p('format one', 'twenty past %s'),
  _p('format one', 'twenty one past %s'),
  _p('format one', 'twenty two past %s'),
  _p('format one', 'twenty three past %s'),
  _p('format one', 'twenty four past %s'),
  _p('format one', 'twenty five past %s'),
  _p('format one', 'twenty six past %s'),
  _p('format one', 'twenty seven past %s'),
  _p('format one', 'twenty eight past %s'),
  _p('format one', 'twenty nine past %s'),
  _p('format one', 'half past %s'),
  _p('format one', 'twenty nine to %s'),
  _p('format one', 'twenty eight to %s'),
  _p('format one', 'twenty seven to %s'),
  _p('format one', 'twenty six to %s'),
  _p('format one', 'twenty five to %s'),
  _p('format one', 'twenty four to %s'),
  _p('format one', 'twenty three to %s'),
  _p('format one', 'twenty two to %s'),
  _p('format one', 'twenty one to %s'),
  _p('format one', 'twenty to %s'),
  _p('format one', 'nineteen to %s'),
  _p('format one', 'eighteen to %s'),
  _p('format one', 'seventeen to %s'),
  _p('format one', 'sixteen to %s'),
  _p('format one', 'quarter to %s'),
  _p('format one', 'fourteen to %s'),
  _p('format one', 'thirteen to %s'),
  _p('format one', 'twelve to %s'),
  _p('format one', 'eleven to %s'),
  _p('format one', 'ten to %s'),
  _p('format one', 'nine to %s'),
  _p('format one', 'eight to %s'),
  _p('format one', 'seven to %s'),
  _p('format one', 'six to %s'),
  _p('format one', 'five to %s'),
  _p('format one', 'four to %s'),
  _p('format one', 'three to %s'),
  _p('format one', 'two to %s'),
  _p('format one', 'one to %s'),
  _p('format one', "%s o'clock"),
];

export const midnightFormatOne: () => string = () =>
  _p('format one', 'midnight');

export const noonFormatOne: () => string = () => _p('format one', 'noon');

/**
 * @returns a list of strings for telling the time as "H M"
 */
export const timesFormatTwo: () => string[] = () => [
  _p('format two', "%s o'clock"),
  _p('format two', '%s oh one'),
  _p('format two', '%s oh two'),
  _p('format two', '%s oh three'),
  _p('format two', '%s oh four'),
  _p('format two', '%s oh five'),
  _p('format two', '%s oh six'),
  _p('format two', '%s oh seven'),
  _p('format two', '%s oh eight'),
  _p('format two', '%s oh nine'),
  _p('format two', '%s ten'),
  _p('format two', '%s eleven'),
  _p('format two', '%s twelve'),
  _p('format two', '%s thirteen'),
  _p('format two', '%s fourteen'),
  _p('format two', '%s fifteen'),
  _p('format two', '%s sixteen'),
  _p('format two', '%s seventeen'),
  _p('format two', '%s eighteen'),
  _p('format two', '%s nineteen'),
  _p('format two', '%s twenty'),
  _p('format two', '%s twenty one'),
  _p('format two', '%s twenty two'),
  _p('format two', '%s twenty three'),
  _p('format two', '%s twenty four'),
  _p('format two', '%s twenty five'),
  _p('format two', '%s twenty six'),
  _p('format two', '%s twenty seven'),
  _p('format two', '%s twenty eight'),
  _p('format two', '%s twenty nine'),
  _p('format two', '%s thirty'),
  _p('format two', '%s thirty one'),
  _p('format two', '%s thirty two'),
  _p('format two', '%s thirty three'),
  _p('format two', '%s thirty four'),
  _p('format two', '%s thirty five'),
  _p('format two', '%s thirty six'),
  _p('format two', '%s thirty seven'),
  _p('format two', '%s thirty eight'),
  _p('format two', '%s thirty nine'),
  _p('format two', '%s forty'),
  _p('format two', '%s forty one'),
  _p('format two', '%s forty two'),
  _p('format two', '%s forty three'),
  _p('format two', '%s forty four'),
  _p('format two', '%s forty five'),
  _p('format two', '%s forty six'),
  _p('format two', '%s forty seven'),
  _p('format two', '%s forty eight'),
  _p('format two', '%s forty nine'),
  _p('format two', '%s fifty'),
  _p('format two', '%s fifty one'),
  _p('format two', '%s fifty two'),
  _p('format two', '%s fifty three'),
  _p('format two', '%s fifty four'),
  _p('format two', '%s fifty five'),
  _p('format two', '%s fifty six'),
  _p('format two', '%s fifty seven'),
  _p('format two', '%s fifty eight'),
  _p('format two', '%s fifty nine'),
  _p('format two', "%s o'clock"),
];

export const midnightFormatTwo: () => string = () => _p('format two', 'twelve');

export const noonFormatTwo: () => string = () => _p('format two', 'twelve');

/**
 * @returns a list of strings that tells the hour
 */
export const hourNames: () => string[] = () => [
  _p('00:00 / 12:00 AM', 'midnight'),
  _p('01:00 / 1:00 AM', 'one'),
  _p('02:00 / 2:00 AM', 'two'),
  _p('03:00 / 3:00 AM', 'three'),
  _p('04:00 / 4:00 AM', 'four'),
  _p('05:00 / 5:00 AM', 'five'),
  _p('06:00 / 6:00 AM', 'six'),
  _p('07:00 / 7:00 AM', 'seven'),
  _p('08:00 / 8:00 AM', 'eight'),
  _p('09:00 / 9:00 AM', 'nine'),
  _p('10:00 / 10:00 AM', 'ten'),
  _p('11:00 / 11:00 AM', 'eleven'),
  _p('12:00 / 12:00 PM', 'noon'),
  _p('13:00 / 1:00 PM', 'one'),
  _p('14:00 / 2:00 PM', 'two'),
  _p('15:00 / 3:00 PM', 'three'),
  _p('16:00 / 4:00 PM', 'four'),
  _p('17:00 / 5:00 PM', 'five'),
  _p('18:00 / 6:00 PM', 'six'),
  _p('19:00 / 7:00 PM', 'seven'),
  _p('20:00 / 8:00 PM', 'eight'),
  _p('21:00 / 9:00 PM', 'nine'),
  _p('22:00 / 10:00 PM', 'ten'),
  _p('23:00 / 11:00 PM', 'eleven'),
];

/**
 * @returns the string for the word "midnight"
 */
export const midnight: () => string = () => _p('exactly midnight', 'midnight');

/**
 * @returns the string for the word "noon"
 */
export const noon: () => string = () => _p('exactly noon', 'noon');
