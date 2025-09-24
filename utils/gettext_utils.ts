/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Gettext function interface for GNOME Shell extensions
 */
export interface GettextFunctions {
  _: (msgid: string) => string;
  ngettext: (msgid: string, msgid_plural: string, n: number) => string;
  pgettext: (msgctxt: string, msgid: string) => string;
}
