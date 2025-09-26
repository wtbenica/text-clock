/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { GettextFunctions } from "../gettext/gettext_utils.js";

let _fn: (msgid: string) => string = (s) => s;
let _n: (msgid: string, msgid_plural: string, n: number) => string = (
  s,
  p,
  n,
) => (n === 1 ? s : p);
let _p: (msgctxt: string, msgid: string) => string = (_ctx, s) => s;

try {
  const res = (imports as any).resource?.org?.gnome?.Shell?.Extensions?.js
    ?.extensions?.prefs;
  if (res) {
    _fn = res.gettext;
    _n = res.ngettext;
    _p = res.pgettext;
  }
} catch {
  // leave fallbacks
}

export const prefsGettext: GettextFunctions = {
  _: _fn,
  ngettext: _n,
  pgettext: _p,
};
