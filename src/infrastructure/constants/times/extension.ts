// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { extensionGettext } from "../../utils/gettext/gettext_utils_ext.js";
import { createTimeConstants } from "../times/core.js";

const fns = extensionGettext;
export const {
  timesFormatOne,
  midnightFormatOne,
  noonFormatOne,
  timesFormatTwo,
  midnightFormatTwo,
  noonFormatTwo,
  hourNames,
  midnight,
  noon,
} = createTimeConstants(fns);
