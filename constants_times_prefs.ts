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
  pgettext,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

/**
 * @returns a list of strings for telling the time as "M past H(%s)" or "M to H(%s)"
 */
export const timesFormatOne: () => string[] = () => [
  pgettext('format one', "%s o'clock"),
  pgettext('format one', 'one past %s'),
  pgettext('format one', 'two past %s'),
  pgettext('format one', 'three past %s'),
  pgettext('format one', 'four past %s'),
  pgettext('format one', 'five past %s'),
  pgettext('format one', 'six past %s'),
  pgettext('format one', 'seven past %s'),
  pgettext('format one', 'eight past %s'),
  pgettext('format one', 'nine past %s'),
  pgettext('format one', 'ten past %s'),
  pgettext('format one', 'eleven past %s'),
  pgettext('format one', 'twelve past %s'),
  pgettext('format one', 'thirteen past %s'),
  pgettext('format one', 'fourteen past %s'),
  pgettext('format one', 'quarter past %s'),
  pgettext('format one', 'sixteen past %s'),
  pgettext('format one', 'seventeen past %s'),
  pgettext('format one', 'eighteen past %s'),
  pgettext('format one', 'nineteen past %s'),
  pgettext('format one', 'twenty past %s'),
  pgettext('format one', 'twenty one past %s'),
  pgettext('format one', 'twenty two past %s'),
  pgettext('format one', 'twenty three past %s'),
  pgettext('format one', 'twenty four past %s'),
  pgettext('format one', 'twenty five past %s'),
  pgettext('format one', 'twenty six past %s'),
  pgettext('format one', 'twenty seven past %s'),
  pgettext('format one', 'twenty eight past %s'),
  pgettext('format one', 'twenty nine past %s'),
  pgettext('format one', 'half past %s'),
  pgettext('format one', 'twenty nine to %s'),
  pgettext('format one', 'twenty eight to %s'),
  pgettext('format one', 'twenty seven to %s'),
  pgettext('format one', 'twenty six to %s'),
  pgettext('format one', 'twenty five to %s'),
  pgettext('format one', 'twenty four to %s'),
  pgettext('format one', 'twenty three to %s'),
  pgettext('format one', 'twenty two to %s'),
  pgettext('format one', 'twenty one to %s'),
  pgettext('format one', 'twenty to %s'),
  pgettext('format one', 'nineteen to %s'),
  pgettext('format one', 'eighteen to %s'),
  pgettext('format one', 'seventeen to %s'),
  pgettext('format one', 'sixteen to %s'),
  pgettext('format one', 'quarter to %s'),
  pgettext('format one', 'fourteen to %s'),
  pgettext('format one', 'thirteen to %s'),
  pgettext('format one', 'twelve to %s'),
  pgettext('format one', 'eleven to %s'),
  pgettext('format one', 'ten to %s'),
  pgettext('format one', 'nine to %s'),
  pgettext('format one', 'eight to %s'),
  pgettext('format one', 'seven to %s'),
  pgettext('format one', 'six to %s'),
  pgettext('format one', 'five to %s'),
  pgettext('format one', 'four to %s'),
  pgettext('format one', 'three to %s'),
  pgettext('format one', 'two to %s'),
  pgettext('format one', 'one to %s'),
  pgettext('format one', "%s o'clock"),
];

/**
 * @returns the string for the word "midnight" in format one: e.g. "five past -midnight-"
 */
export const midnightFormatOne: () => string = () =>
  pgettext('Should be able to replace %s in format one templates', 'midnight');

/**
 * @returns the string for the word "noon" in format one: e.g. "five past -noon-"
 */
export const noonFormatOne: () => string = () =>
  pgettext('Must be able to replace %s in format one templates', 'noon');

/**
 * @returns a list of strings for telling the time as "H M"
 */
export const timesFormatTwo: () => string[] = () => [
  pgettext('format two', "%s o'clock"),
  pgettext('format two', '%s oh one'),
  pgettext('format two', '%s oh two'),
  pgettext('format two', '%s oh three'),
  pgettext('format two', '%s oh four'),
  pgettext('format two', '%s oh five'),
  pgettext('format two', '%s oh six'),
  pgettext('format two', '%s oh seven'),
  pgettext('format two', '%s oh eight'),
  pgettext('format two', '%s oh nine'),
  pgettext('format two', '%s ten'),
  pgettext('format two', '%s eleven'),
  pgettext('format two', '%s twelve'),
  pgettext('format two', '%s thirteen'),
  pgettext('format two', '%s fourteen'),
  pgettext('format two', '%s fifteen'),
  pgettext('format two', '%s sixteen'),
  pgettext('format two', '%s seventeen'),
  pgettext('format two', '%s eighteen'),
  pgettext('format two', '%s nineteen'),
  pgettext('format two', '%s twenty'),
  pgettext('format two', '%s twenty one'),
  pgettext('format two', '%s twenty two'),
  pgettext('format two', '%s twenty three'),
  pgettext('format two', '%s twenty four'),
  pgettext('format two', '%s twenty five'),
  pgettext('format two', '%s twenty six'),
  pgettext('format two', '%s twenty seven'),
  pgettext('format two', '%s twenty eight'),
  pgettext('format two', '%s twenty nine'),
  pgettext('format two', '%s thirty'),
  pgettext('format two', '%s thirty one'),
  pgettext('format two', '%s thirty two'),
  pgettext('format two', '%s thirty three'),
  pgettext('format two', '%s thirty four'),
  pgettext('format two', '%s thirty five'),
  pgettext('format two', '%s thirty six'),
  pgettext('format two', '%s thirty seven'),
  pgettext('format two', '%s thirty eight'),
  pgettext('format two', '%s thirty nine'),
  pgettext('format two', '%s forty'),
  pgettext('format two', '%s forty one'),
  pgettext('format two', '%s forty two'),
  pgettext('format two', '%s forty three'),
  pgettext('format two', '%s forty four'),
  pgettext('format two', '%s forty five'),
  pgettext('format two', '%s forty six'),
  pgettext('format two', '%s forty seven'),
  pgettext('format two', '%s forty eight'),
  pgettext('format two', '%s forty nine'),
  pgettext('format two', '%s fifty'),
  pgettext('format two', '%s fifty one'),
  pgettext('format two', '%s fifty two'),
  pgettext('format two', '%s fifty three'),
  pgettext('format two', '%s fifty four'),
  pgettext('format two', '%s fifty five'),
  pgettext('format two', '%s fifty six'),
  pgettext('format two', '%s fifty seven'),
  pgettext('format two', '%s fifty eight'),
  pgettext('format two', '%s fifty nine'),
  pgettext('format two', "%s o'clock"),
];

/**
 * @returns the string for the word "midnight" in format two: e.g. "-twelve- oh four"
 */
export const midnightFormatTwo: () => string = () =>
  pgettext('Must be able to replace %s in format two templates', 'twelve');

/**
 * @returns the string for the word "noon" in format two: e.g. "-twelve- oh four"
 */
export const noonFormatTwo: () => string = () =>
  pgettext('Must be able to replace %s in format two templates', 'twelve');

/**
 * @returns a list of strings that tells the hour
 */
export const hourNames: () => string[] = () => [
  pgettext('00:00 / 12:00 AM', 'midnight'),
  pgettext('01:00 / 01:00 AM', 'one'),
  pgettext('02:00 / 02:00 AM', 'two'),
  pgettext('03:00 / 03:00 AM', 'three'),
  pgettext('04:00 / 04:00 AM', 'four'),
  pgettext('05:00 / 05:00 AM', 'five'),
  pgettext('06:00 / 06:00 AM', 'six'),
  pgettext('07:00 / 07:00 AM', 'seven'),
  pgettext('08:00 / 08:00 AM', 'eight'),
  pgettext('09:00 / 09:00 AM', 'nine'),
  pgettext('10:00 / 10:00 AM', 'ten'),
  pgettext('11:00 / 11:00 AM', 'eleven'),
  pgettext('12:00 / 12:00 PM', 'noon'),
  pgettext('13:00 / 01:00 PM', 'one'),
  pgettext('14:00 / 02:00 PM', 'two'),
  pgettext('15:00 / 03:00 PM', 'three'),
  pgettext('16:00 / 04:00 PM', 'four'),
  pgettext('17:00 / 05:00 PM', 'five'),
  pgettext('18:00 / 06:00 PM', 'six'),
  pgettext('19:00 / 07:00 PM', 'seven'),
  pgettext('20:00 / 08:00 PM', 'eight'),
  pgettext('21:00 / 09:00 PM', 'nine'),
  pgettext('22:00 / 10:00 PM', 'ten'),
  pgettext('23:00 / 11:00 PM', 'eleven'),
];

/**
 * @returns the string for the word "midnight" when it is exactly midnight
 */
export const midnight: () => string = () =>
  pgettext('exactly midnight', 'midnight');

/**
 * @returns the string for the word "noon" when it is exactly noon
 */
export const noon: () => string = () => pgettext('exactly noon', 'noon');
