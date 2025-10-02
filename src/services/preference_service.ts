/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
  ClockFormatter,
  Fuzziness,
  TimeFormat,
} from "../core/clock_formatter.js";
import { Color } from "../models/color.js";
import { logWarn } from "../utils/error_utils.js";
import type { GettextFunctions } from "../utils/gettext/gettext_utils.js";
import { createTranslatePack } from "../utils/translate/translate_pack_utils.js";
import {
  FUZZINESS_CONFIGS,
  DIVIDER_PRESET_CONFIGS,
  TIME_FORMAT_CONFIGS,
  ACCENT_STYLE_CONFIGS,
} from "../constants/preferences.js";
import type {
  ValuePreferenceConfig,
  CustomPreferenceConfig,
  AccentStyleConfig,
} from "../models/preference_types.js";

/**
 * Preference service providing clean access to preference configurations.
 *
 * This service exposes only the necessary public API for accessing preference
 * data, hiding implementation details and providing type-safe access methods.
 */

/**
 * Generate a sample time string for display in preference UI.
 *
 * Creates a sample time display using a fixed demonstration time that clearly
 * shows the difference between formats. Uses 9:10 which displays as either
 * "ten past nine" or "nine ten", ensuring the formats look distinct.
 *
 * @param timeFormat - Time format to use for the sample
 * @param translateFn - Translation functions for localization
 * @param fallback - Fallback string to return if sample generation fails
 * @returns A sample time string in the specified format, or the fallback if generation fails
 */
export function generateSampleTime(
  timeFormat: TimeFormat,
  translateFn: GettextFunctions,
  fallback: string,
): string {
  try {
    // 9:05 will display as "five past nine" vs "nine oh five"
    const demoTime = new Date();
    demoTime.setHours(9, 5, 0, 0);

    const wordPack = createTranslatePack(translateFn);
    const formatter = new ClockFormatter(wordPack);

    const clockText = formatter.getClockText(
      demoTime,
      false, // showDate
      false, // showWeekday
      timeFormat,
      Fuzziness.FIVE_MINUTES,
    );

    return clockText;
  } catch (err) {
    logWarn(`Error generating sample time: ${err}`);
    return fallback; // Use provided fallback instead of empty string
  }
}

/**
 * Get time format configurations with generated sample displays.
 *
 * @param translateFn - Translation functions for localization
 * @returns Time format configs with sample time displays
 */
export function getTimeFormatConfigsWithSamples(
  translateFn: GettextFunctions,
): ValuePreferenceConfig<string>[] {
  return TIME_FORMAT_CONFIGS.map((config, index) => {
    const timeFormat =
      index === 0 ? TimeFormat.FORMAT_ONE : TimeFormat.FORMAT_TWO;
    const sample = generateSampleTime(
      timeFormat,
      translateFn,
      config.displayName(translateFn),
    );

    return {
      ...config,
      displayName: () => sample,
    };
  });
}

/**
 * Get the actual divider text based on preset index and custom text.
 *
 * Resolves the final divider text to display based on the user's selection.
 * For preset indices 0-3, returns the preset's value. For index 4 ("custom"),
 * returns the user's custom text string.
 *
 * @param presetIndex - GSettings enum index for divider preset (0-4)
 * @param customText - User-provided custom divider text (used when presetIndex is 4)
 * @returns The actual divider text to display
 */
export function getDividerText(
  presetIndex: number,
  customText: string,
): string {
  const config = getDividerPresetConfig(presetIndex);

  if ("isCustom" in config && config.isCustom) {
    return customText;
  }

  return (config as ValuePreferenceConfig<string>).value;
}

/**
 * Get accent style configuration by enum index.
 *
 * @param index - GSettings enum index
 * @returns Accent style configuration or first option if invalid
 */
export function getAccentStyleConfig(index: number): AccentStyleConfig {
  return ACCENT_STYLE_CONFIGS[index] || ACCENT_STYLE_CONFIGS[0];
}

/**
 * Get fuzziness value in minutes by enum index.
 *
 * @param index - GSettings enum index
 * @returns Fuzziness value in minutes or 5 if invalid
 */
export function getFuzzinessMinutes(index: number): number {
  const config = FUZZINESS_CONFIGS[index];
  return config ? config.value : 5; // Default to 5 minutes
}

/**
 * Apply accent style color transformations to a base color.
 *
 * @param baseColor - The base accent color
 * @param styleIndex - The accent style enum index
 * @returns Object with clock, date, and divider colors
 */
export function applyAccentStyle(baseColor: Color, styleIndex: number) {
  const config = getAccentStyleConfig(styleIndex);
  return {
    clockColor: config.clockColor(baseColor),
    dateColor: config.dateColor(baseColor),
    dividerColor: config.dividerColor(baseColor),
  };
}

// Export config arrays that are needed by preference UI
// These are the ones that are actually used to build dropdowns
export {
  FUZZINESS_CONFIGS,
  DIVIDER_PRESET_CONFIGS,
  TIME_FORMAT_CONFIGS,
  ACCENT_STYLE_CONFIGS,
};

// Internal helper - not exported
function getDividerPresetConfig(
  index: number,
): ValuePreferenceConfig<string> | CustomPreferenceConfig {
  return DIVIDER_PRESET_CONFIGS[index] || DIVIDER_PRESET_CONFIGS[0];
}
