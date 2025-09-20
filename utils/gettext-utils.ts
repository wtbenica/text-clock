/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Centralized gettext utilities for the Text Clock extension
 */

import {
  gettext as _,
  ngettext,
  pgettext,
} from "resource:///org/gnome/shell/extensions/extension.js";

/**
 * Gettext function interface for GNOME Shell extensions
 */
export interface GettextFunctions {
  _: (msgid: string) => string;
  ngettext: (msgid: string, msgid_plural: string, n: number) => string;
  pgettext: (msgctxt: string, msgid: string) => string;
}

/**
 * Creates a gettext functions object for use in constants and other modules
 *
 * @returns Object containing gettext functions
 */
export function createGettextFunctions(): GettextFunctions {
  return {
    _: _,
    ngettext: ngettext,
    pgettext: pgettext,
  };
}

/**
 * Gettext functions for extension context (main extension code)
 */
export const extensionGettext = createGettextFunctions();

/**
 * Gettext functions for preferences context (preferences window)
 */
export const prefsGettext = createGettextFunctions();
