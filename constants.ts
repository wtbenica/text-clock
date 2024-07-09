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

import { gettext as _, ngettext, pgettext as _p } from 'resource:///org/gnome/shell/extensions/extension.js';

import { WordPack } from './word_pack.js';

export const TRANSLATE_PACK = () => new WordPack({
  times: [
    _("%s o'clock"), _("one past %s"), _("two past %s"), _("three past %s"), _("four past %s"), _("five past %s"), _("six past %s"), _("seven past %s"), _("eight past %s"), _("nine past %s"), _("ten past %s"), _("eleven past %s"), _("twelve past %s"), _("thirteen past %s"), _("fourteen past %s"), _("quarter past %s"), _("sixteen past %s"), _("seventeen past %s"), _("eighteen past %s"), _("nineteen past %s"), _("twenty past %s"), _("twenty one past %s"), _("twenty two past %s"), _("twenty three past %s"), _("twenty four past %s"), _("twenty five past %s"), _("twenty six past %s"), _("twenty seven past %s"), _("twenty eight past %s"), _("twenty nine past %s"), _("half past %s"), _("twenty nine to %s"), _("twenty eight to %s"), _("twenty seven to %s"), _("twenty six to %s"), _("twenty five to %s"), _("twenty four to %s"), _("twenty three to %s"), _("twenty two to %s"), _("twenty one to %s"), _("twenty to %s"), _("nineteen to %s"), _("eighteen to %s"), _("seventeen to %s"), _("sixteen to %s"), _("quarter to %s"), _("fourteen to %s"), _("thirteen to %s"), _("twelve to %s"), _("eleven to %s"), _("ten to %s"), _("nine to %s"), _("eight to %s"), _("seven to %s"), _("six to %s"), _("five to %s"), _("four to %s"), _("three to %s"), _("two to %s"), _("one to %s")
  ],
  names: [
    _p("Translate either 'midnight' or 'twelve', whichever fits in 'five after %s' and 'twenty to %s'. 'midnight' is preferred.", "midnight"), _("one"), _("two"), _("three"), _("four"), _("five"), _("six"), _("seven"), _("eight"), _("nine"), _("ten"), _("eleven"), _p("Translate either 'noon' and 'twelve', whichever fits in 'five after %s' and 'twenty to %s'. 'noon' is preferred.", "noon")
  ],
  days: [_("sunday the %s"), _("monday the %s"), _("tuesday the %s"), _("wednesday the %s"), _("thursday the %s"), _("friday the %s"), _("saturday the %s")],
  midnight: _("midnight"),
  noon: _("noon"),
  daysOfMonth: [
    _("first"), _("second"), _("third"), _("fourth"), _("fifth"), _("sixth"), _("seventh"), _("eighth"), _("ninth"), _("tenth"), _("eleventh"), _("twelfth"), _("thirteenth"), _("fourteenth"), _("fifteenth"), _("sixteenth"), _("seventeenth"), _("eighteenth"), _("nineteenth"), _("twentieth"), _("twenty first"), _("twenty second"), _("twenty third"), _("twenty fourth"), _("twenty fifth"), _("twenty sixth"), _("twenty seventh"), _("twenty eighth"), _("twenty ninth"), _("thirtieth"), _("thirty first")
  ]
});


