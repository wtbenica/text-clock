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
 * Centralized gettext utilities for the Text Clock extension
 */

import { gettext as _, ngettext, pgettext } from "resource:///org/gnome/shell/extensions/extension.js";

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
        ngettext: ngettext as any,
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