/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { GettextFunctions } from "../gettext/gettext_utils.js";

/**
 * Preferences context gettext utilities.
 *
 * This module provides gettext functions for the preferences context.
 * It attempts to use the real GNOME Shell gettext functions when available,
 * and falls back to test-friendly functions during testing/compilation.
 */

// Default fallback functions for testing
let _fn: (msgid: string) => string = (s) => s;
let _n: (msgid: string, msgid_plural: string, n: number) => string = (
  s,
  p,
  n,
) => (n === 1 ? s : p);
let _p: (msgctxt: string, msgid: string) => string = (_ctx, s) => s;

/**
 * Initialize gettext functions with runtime dependencies.
 * This should be called by the preferences during initialization.
 */
export function initPrefsGettext(
  gettext: (msgid: string) => string,
  ngettext: (msgid: string, msgid_plural: string, n: number) => string,
  pgettext: (msgctxt: string, msgid: string) => string,
): void {
  _fn = gettext;
  _n = ngettext;
  _p = pgettext;
}

/**
 * Gettext functions for preferences context (preferences window).
 * Uses injected functions when available, falls back to test functions.
 */
export const prefsGettext: GettextFunctions = {
  _: (msgid: string) => _fn(msgid),
  ngettext: (msgid: string, msgid_plural: string, n: number) =>
    _n(msgid, msgid_plural, n),
  pgettext: (msgctxt: string, msgid: string) => _p(msgctxt, msgid),
};
