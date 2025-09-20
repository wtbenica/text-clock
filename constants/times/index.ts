// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

export * from "./core.js";
export {
  timesFormatOne as timesFormatOneExtension,
  midnightFormatOne as midnightFormatOneExtension,
  noonFormatOne as noonFormatOneExtension,
  timesFormatTwo as timesFormatTwoExtension,
  midnightFormatTwo as midnightFormatTwoExtension,
  noonFormatTwo as noonFormatTwoExtension,
  hourNames as hourNamesExtension,
  midnight as midnightExtension,
  noon as noonExtension,
} from "./extension.js";
export {
  timesFormatOne as timesFormatOnePrefs,
  midnightFormatOne as midnightFormatOnePrefs,
  noonFormatOne as noonFormatOnePrefs,
  timesFormatTwo as timesFormatTwoPrefs,
  midnightFormatTwo as midnightFormatTwoPrefs,
  noonFormatTwo as noonFormatTwoPrefs,
  hourNames as hourNamesPrefs,
  midnight as midnightPrefs,
  noon as noonPrefs,
} from "./prefs.js";
