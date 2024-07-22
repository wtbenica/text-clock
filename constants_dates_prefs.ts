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
 * The date format for showing the date only, e.g. "the sixth"
 */
export const dateOnly: () => string = () =>
  pgettext(
    'This is how someone would say the day of the month only. As in, "My rent is due on the %s."',
    'the %s',
  );

/**
 * The date format for showing the day of the week and the date, e.g. "Sunday the fifth"
 */
export const weekdays: () => string[] = () => [
  pgettext(
    'The day of the week and the date. The date will be substituted in the %s. For example, "Sunday the fifth".',
    'sunday the %s',
  ),
  pgettext(
    'The day of the week and the date. The date will be substituted in the %s. For example, "Monday the sixth".',
    'monday the %s',
  ),
  pgettext(
    'The day of the week and the date. The date will be substituted in the %s. For example, "Tuesday the seventh".',
    'tuesday the %s',
  ),
  pgettext(
    'The day of the week and the date. The date will be substituted in the %s. For example, "Wednesday the eighth".',
    'wednesday the %s',
  ),
  pgettext(
    'The day of the week and the date. The date will be substituted in the %s. For example, "Thursday the ninth".',
    'thursday the %s',
  ),
  pgettext(
    'The day of the week and the date. The date will be substituted in the %s. For example, "Friday the tenth".',
    'friday the %s',
  ),
  pgettext(
    'The day of the week and the date. The date will be substituted in the %s. For example, "Saturday the eleventh".',
    'saturday the %s',
  ),
];

/**
 * The day of the month written out, e.g. "first", "second", "third"
 */
export const daysOfMonth: () => string[] = () => [
  _('first'),
  _('second'),
  _('third'),
  _('fourth'),
  _('fifth'),
  _('sixth'),
  _('seventh'),
  _('eighth'),
  _('ninth'),
  _('tenth'),
  _('eleventh'),
  _('twelfth'),
  _('thirteenth'),
  _('fourteenth'),
  _('fifteenth'),
  _('sixteenth'),
  _('seventeenth'),
  _('eighteenth'),
  _('nineteenth'),
  _('twentieth'),
  _('twenty first'),
  _('twenty second'),
  _('twenty third'),
  _('twenty fourth'),
  _('twenty fifth'),
  _('twenty sixth'),
  _('twenty seventh'),
  _('twenty eighth'),
  _('twenty ninth'),
  _('thirtieth'),
  _('thirty first'),
];
