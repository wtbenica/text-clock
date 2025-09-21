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
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import { GettextFunctions } from "./gettext-utils.js";

/**
 * Gettext functions for preferences context (preferences window)
 */
export const prefsGettext: GettextFunctions = {
  _: _,
  ngettext: ngettext,
  pgettext: pgettext,
};
