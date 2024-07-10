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
} from "resource:///org/gnome/shell/extensions/extension.js";

import { WordPack } from "./word_pack.js";
import * as ConstantsEn from "./constants_en.js";

export const TRANSLATE_PACK = () =>
  new WordPack({
    times: ConstantsEn.minutes_past_to.map((time: string) => _(time)),
    names: ConstantsEn.hour_names.map((name: string) => _(name)),
    days: ConstantsEn.weekdays.map((day: string) => _(day)),
    midnight: _(ConstantsEn.midnight),
    noon: _(ConstantsEn.noon),
    daysOfMonth: ConstantsEn.daysOfMonth.map((day: string) => _(day)),
  });
