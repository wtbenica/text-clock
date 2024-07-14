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
} from 'resource:///org/gnome/shell/extensions/extension.js';

import { WordPack } from './word_pack.js';
import { daysOfWeek, dateOnly, daysOfMonth } from './constants_dates.js';

/**
 * @returns a word pack that contains the strings for telling the time and date
 */
export const TRANSLATE_PACK: () => WordPack = () =>
  new WordPack({
    timesTenToThree: timesPastTo(),
    timesTwoFifty: timesCountMinutes(),
    names: hourNames(),
    days: daysOfWeek(),
    dayOnly: dateOnly(),
    midnight: midnight(),
    noon: noon(),
    twelve: twelve(),
    daysOfMonth: daysOfMonth(),
  });

/**
 * @returns a list of strings for telling the time as "M past H(%s)" or "M to H(%s)"
 */
export const timesPastTo: () => string[] = () => [
  _("%s o'clock"),
  _('one past %s'),
  _('two past %s'),
  _('three past %s'),
  _('four past %s'),
  _('five past %s'),
  _('six past %s'),
  _('seven past %s'),
  _('eight past %s'),
  _('nine past %s'),
  _('ten past %s'),
  _('eleven past %s'),
  _('twelve past %s'),
  _('thirteen past %s'),
  _('fourteen past %s'),
  _('quarter past %s'),
  _('sixteen past %s'),
  _('seventeen past %s'),
  _('eighteen past %s'),
  _('nineteen past %s'),
  _('twenty past %s'),
  _('twenty one past %s'),
  _('twenty two past %s'),
  _('twenty three past %s'),
  _('twenty four past %s'),
  _('twenty five past %s'),
  _('twenty six past %s'),
  _('twenty seven past %s'),
  _('twenty eight past %s'),
  _('twenty nine past %s'),
  _('half past %s'),
  _('twenty nine to %s'),
  _('twenty eight to %s'),
  _('twenty seven to %s'),
  _('twenty six to %s'),
  _('twenty five to %s'),
  _('twenty four to %s'),
  _('twenty three to %s'),
  _('twenty two to %s'),
  _('twenty one to %s'),
  _('twenty to %s'),
  _('nineteen to %s'),
  _('eighteen to %s'),
  _('seventeen to %s'),
  _('sixteen to %s'),
  _('quarter to %s'),
  _('fourteen to %s'),
  _('thirteen to %s'),
  _('twelve to %s'),
  _('eleven to %s'),
  _('ten to %s'),
  _('nine to %s'),
  _('eight to %s'),
  _('seven to %s'),
  _('six to %s'),
  _('five to %s'),
  _('four to %s'),
  _('three to %s'),
  _('two to %s'),
  _('one to %s'),
  _("%s o'clock"),
];

/**
 * @returns a list of strings for telling the time as "H M"
 */
export const timesCountMinutes: () => string[] = () => [
  _("%s o'clock"),
  _('%s oh one'),
  _('%s oh two'),
  _('%s oh three'),
  _('%s oh four'),
  _('%s oh five'),
  _('%s oh six'),
  _('%s oh seven'),
  _('%s oh eight'),
  _('%s oh nine'),
  _('%s ten'),
  _('%s eleven'),
  _('%s twelve'),
  _('%s thirteen'),
  _('%s fourteen'),
  _('%s fifteen'),
  _('%s sixteen'),
  _('%s seventeen'),
  _('%s eighteen'),
  _('%s nineteen'),
  _('%s twenty'),
  _('%s twenty one'),
  _('%s twenty two'),
  _('%s twenty three'),
  _('%s twenty four'),
  _('%s twenty five'),
  _('%s twenty six'),
  _('%s twenty seven'),
  _('%s twenty eight'),
  _('%s twenty nine'),
  _('%s thirty'),
  _('%s thirty one'),
  _('%s thirty two'),
  _('%s thirty three'),
  _('%s thirty four'),
  _('%s thirty five'),
  _('%s thirty six'),
  _('%s thirty seven'),
  _('%s thirty eight'),
  _('%s thirty nine'),
  _('%s forty'),
  _('%s forty one'),
  _('%s forty two'),
  _('%s forty three'),
  _('%s forty four'),
  _('%s forty five'),
  _('%s forty six'),
  _('%s forty seven'),
  _('%s forty eight'),
  _('%s forty nine'),
  _('%s fifty'),
  _('%s fifty one'),
  _('%s fifty two'),
  _('%s fifty three'),
  _('%s fifty four'),
  _('%s fifty five'),
  _('%s fifty six'),
  _('%s fifty seven'),
  _('%s fifty eight'),
  _('%s fifty nine'),
];

/**
 * @returns a list of strings that tells the hour
 */
export const hourNames: () => string[] = () => [
  _('midnight'),
  _('one'),
  _('two'),
  _('three'),
  _('four'),
  _('five'),
  _('six'),
  _('seven'),
  _('eight'),
  _('nine'),
  _('ten'),
  _('eleven'),
  _('noon'),
];

/**
 * @returns the string for the word "midnight"
 */
export const midnight: () => string = () => _('midnight');

/**
 * @returns the string for the word "noon"
 */
export const noon: () => string = () => _('noon');

/**
 * @returns the string for the word "twelve"
 */
export const twelve: () => string = () => _('twelve');
