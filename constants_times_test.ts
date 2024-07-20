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
 * @returns a list of strings for telling the time as "M past H(%s)" or "M to H(%s)"
 */
export const timesFormatOne: () => string[] = () => [
  "%s o'clock",
  'one past %s',
  'two past %s',
  'three past %s',
  'four past %s',
  'five past %s',
  'six past %s',
  'seven past %s',
  'eight past %s',
  'nine past %s',
  'ten past %s',
  'eleven past %s',
  'twelve past %s',
  'thirteen past %s',
  'fourteen past %s',
  'quarter past %s',
  'sixteen past %s',
  'seventeen past %s',
  'eighteen past %s',
  'nineteen past %s',
  'twenty past %s',
  'twenty one past %s',
  'twenty two past %s',
  'twenty three past %s',
  'twenty four past %s',
  'twenty five past %s',
  'twenty six past %s',
  'twenty seven past %s',
  'twenty eight past %s',
  'twenty nine past %s',
  'half past %s',
  'twenty nine to %s',
  'twenty eight to %s',
  'twenty seven to %s',
  'twenty six to %s',
  'twenty five to %s',
  'twenty four to %s',
  'twenty three to %s',
  'twenty two to %s',
  'twenty one to %s',
  'twenty to %s',
  'nineteen to %s',
  'eighteen to %s',
  'seventeen to %s',
  'sixteen to %s',
  'quarter to %s',
  'fourteen to %s',
  'thirteen to %s',
  'twelve to %s',
  'eleven to %s',
  'ten to %s',
  'nine to %s',
  'eight to %s',
  'seven to %s',
  'six to %s',
  'five to %s',
  'four to %s',
  'three to %s',
  'two to %s',
  'one to %s',
  "%s o'clock",
];

export const midnightFormatOne: () => string = () => 'midnight';

export const noonFormatOne: () => string = () => 'noon';

/**
 * @returns a list of strings for telling the time as "H M"
 */
export const timesFormatTwo: () => string[] = () => [
  "%s o'clock",
  '%s oh one',
  '%s oh two',
  '%s oh three',
  '%s oh four',
  '%s oh five',
  '%s oh six',
  '%s oh seven',
  '%s oh eight',
  '%s oh nine',
  '%s ten',
  '%s eleven',
  '%s twelve',
  '%s thirteen',
  '%s fourteen',
  '%s fifteen',
  '%s sixteen',
  '%s seventeen',
  '%s eighteen',
  '%s nineteen',
  '%s twenty',
  '%s twenty one',
  '%s twenty two',
  '%s twenty three',
  '%s twenty four',
  '%s twenty five',
  '%s twenty six',
  '%s twenty seven',
  '%s twenty eight',
  '%s twenty nine',
  '%s thirty',
  '%s thirty one',
  '%s thirty two',
  '%s thirty three',
  '%s thirty four',
  '%s thirty five',
  '%s thirty six',
  '%s thirty seven',
  '%s thirty eight',
  '%s thirty nine',
  '%s forty',
  '%s forty one',
  '%s forty two',
  '%s forty three',
  '%s forty four',
  '%s forty five',
  '%s forty six',
  '%s forty seven',
  '%s forty eight',
  '%s forty nine',
  '%s fifty',
  '%s fifty one',
  '%s fifty two',
  '%s fifty three',
  '%s fifty four',
  '%s fifty five',
  '%s fifty six',
  '%s fifty seven',
  '%s fifty eight',
  '%s fifty nine',
  "%s o'clock",
];

export const midnightFormatTwo: () => string = () => 'twelve';

export const noonFormatTwo: () => string = () => 'twelve';

/**
 * @returns a list of strings that tells the hour
 */
export const hourNames: () => string[] = () => [
  'midnight',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'noon',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
];

/**
 * @returns the string for the word "midnight"
 */
export const midnight: () => string = () => 'midnight';

/**
 * @returns the string for the word "noon"
 */
export const noon: () => string = () => 'noon';
