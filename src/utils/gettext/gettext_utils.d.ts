/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Gettext internationalization utilities for the Text Clock extension.
 */

/**
 * Standard gettext interface for dependency injection across different contexts.
 */
export interface GettextFunctions {
  /** Basic translation function */
  _: (msgid: string) => string;
  /** Plural form translation */
  ngettext: (msgid: string, msgid_plural: string, n: number) => string;
  /** Context-aware translation */
  pgettext: (msgctxt: string, msgid: string) => string;
}
