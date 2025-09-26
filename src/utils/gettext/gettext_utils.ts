/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Gettext internationalization utilities for the Text Clock extension.
 *
 * This module defines the standard interface for gettext functions used
 * throughout the extension for internationalization (i18n) support. It
 * provides a consistent contract for translation functions that work
 * across different contexts (extension runtime, preferences UI).
 *
 * The interface includes all three primary gettext functions:
 * - Basic translation (_)
 * - Plural form handling (ngettext)
 * - Context-aware translation (pgettext)
 *
 * @example
 * ```typescript
 * import { GettextFunctions } from './gettext_utils.js';
 *
 * function createTranslatedText(fns: GettextFunctions) {
 *   const { _, ngettext, pgettext } = fns;
 *
 *   // Basic translation
 *   const title = _('Text Clock');
 *
 *   // Plural handling
 *   const count = 5;
 *   const message = ngettext(
 *     '%d minute', '%d minutes', count
 *   ).replace('%d', count.toString());
 *
 *   // Context-specific translation
 *   const timeWord = pgettext('time display', 'quarter');
 *
 *   return { title, message, timeWord };
 * }
 * ```
 */

/**
 * Standard interface for gettext internationalization functions.
 *
 * Defines the contract for translation functions used throughout the extension.
 * Implementations of this interface provide actual translation functionality
 * for different contexts (GNOME Shell extension runtime, preferences UI, tests).
 *
 * This interface enables dependency injection of translation functions,
 * making the codebase testable and allowing different translation contexts
 * to use the same translation logic.
 *
 * @example
 * ```typescript
 * // Extension runtime implementation
 * const extensionFns: GettextFunctions = {
 *   _: (msgid) => extension.gettext(msgid),
 *   ngettext: (msgid, msgid_plural, n) => extension.ngettext(msgid, msgid_plural, n),
 *   pgettext: (msgctxt, msgid) => extension.pgettext(msgctxt, msgid)
 * };
 *
 * // Preferences UI implementation
 * const prefsFns: GettextFunctions = {
 *   _: (msgid) => _(msgid),
 *   ngettext: (msgid, msgid_plural, n) => ngettext(msgid, msgid_plural, n),
 *   pgettext: (msgctxt, msgid) => pgettext(msgctxt, msgid)
 * };
 *
 * // Test implementation
 * const testFns: GettextFunctions = {
 *   _: (msgid) => msgid,  // Pass through for testing
 *   ngettext: (msgid, msgid_plural, n) => n === 1 ? msgid : msgid_plural,
 *   pgettext: (msgctxt, msgid) => msgid
 * };
 * ```
 */
export interface GettextFunctions {
  /** Basic translation function - translates message IDs to localized text */
  _: (msgid: string) => string;

  /** Plural form translation - handles singular/plural forms based on count */
  ngettext: (msgid: string, msgid_plural: string, n: number) => string;

  /** Context-aware translation - provides context to disambiguate translations */
  pgettext: (msgctxt: string, msgid: string) => string;
}
