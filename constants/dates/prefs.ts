// SPDX-FileCopyrightText: 2025 2024 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { prefsGettext } from "../../utils/gettext-utils.js";
import { createDateConstants } from "../dates/core.js";

const fns = prefsGettext;
export const { dateOnly, weekdays, daysOfMonth } = createDateConstants(fns);
