/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { extensionGettext } from "../../utils/gettext_utils_ext.js";
import { createDateConstants } from "../dates/core.js";

const fns = extensionGettext;
export const { dateOnly, weekdays, daysOfMonth } = createDateConstants(fns);
