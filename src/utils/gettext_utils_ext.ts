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
import { GettextFunctions } from "./gettext_utils.js";

/**
 * Gettext functions for extension context (main extension code)
 */
export const extensionGettext: GettextFunctions = {
  _: _,
  ngettext: ngettext,
  pgettext: pgettext,
};
