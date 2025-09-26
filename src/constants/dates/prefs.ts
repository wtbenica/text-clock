// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { prefsGettext } from "../../utils/gettext";
import { createDateConstants } from "../dates/core.js";

const fns = prefsGettext;
export const { dateOnly, weekdays, daysOfMonth } = createDateConstants(fns);
