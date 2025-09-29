/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Unified preference configuration system.
 *
 * This module provides a centralized, type-safe system for defining all
 * preference options. Each preference type has a clear configuration interface
 * that includes schema information, UI display data, and validation logic.
 *
 * Benefits:
 * - Single Source of Truth: All preference data in one place
 * - Type Safety: TypeScript interfaces ensure consistency
 * - Easy Extension: Add new options by just adding to config arrays
 * - Automatic UI Generation: UI elements generated from config
 * - Schema Validation: Ensures schema and code stay in sync
 *
 * @example
 * ```typescript
 * import { getDividerPresetConfig } from './preference_configs.js';
 *
 * const dividerConfig = getDividerPresetConfig(1); // bullet
 * console.log(dividerConfig.displayName); // "•"
 * console.log(dividerConfig.value); // " • "
 *
 * const fuzzConfig = FUZZINESS_CONFIGS[2]; // 10 minutes
 * console.log(fuzzConfig.displayName); // "10 minutes"
 * console.log(fuzzConfig.value); // 10
 * ```
 */

import {
  ClockFormatter,
  Fuzziness,
  TimeFormat,
} from "../../core/clock_formatter.js";
import { Color } from "../../domain/models/color.js";
import { logWarn } from "../../infrastructure/utils/error_utils.js";
import { GettextFunctions } from "../../infrastructure/utils/gettext/gettext_utils.js";
import { createTranslatePack } from "../../infrastructure/utils/translate/translate_pack_utils.js";

/**
 * Base interface for all preference option configurations.
 *
 * Provides the minimum data structure needed for any preference option,
 * including schema enum information and UI display data with i18n support.
 */
export interface BasePreferenceConfig {
  /** The enum value as defined in the GSettings schema (e.g., "pipe", "dot") */
  schemaValue: string;

  /** Function that returns the human-readable name for the preferences UI */
  displayName: (gettext: GettextFunctions) => string;

  /** Optional function that returns the description shown as subtitle in preferences UI */
  description?: (gettext: GettextFunctions) => string;
}

/**
 * Configuration for preferences that have actual runtime values.
 *
 * Extends BasePreferenceConfig with the actual value used by the extension
 * when this option is selected.
 */
export interface ValuePreferenceConfig<T> extends BasePreferenceConfig {
  /** The actual value used by the extension when this option is selected */
  value: T;
}

/**
 * Configuration for preferences that have custom behavior.
 *
 * Some preferences (like custom divider text) don't have fixed values
 * but instead use user-provided input or computed values.
 */
export interface CustomPreferenceConfig extends BasePreferenceConfig {
  /** Whether this option represents a custom/user-defined value */
  isCustom: true;
}

/**
 * Configuration for accent color style variations.
 *
 * Defines color transformation functions for different visual accent styles,
 * allowing flexible color schemes while maintaining consistent theming.
 */
export interface AccentStyleConfig extends BasePreferenceConfig {
  /** Transform function for clock text color */
  clockColor: (accent: Color) => Color;

  /** Transform function for date text color */
  dateColor: (accent: Color) => Color;

  /** Transform function for divider color */
  dividerColor: (accent: Color) => Color;
}

/**
 * Configuration for fuzziness time intervals.
 *
 * Maps schema enum values to actual minute intervals used for time rounding.
 */
export const FUZZINESS_CONFIGS: readonly ValuePreferenceConfig<number>[] = [
  {
    schemaValue: "1 minute",
    displayName: ({ _ }) => _("one minute"),
    description: ({ _ }) => _("Most precise time display"),
    value: 1,
  },
  {
    schemaValue: "5 minutes",
    displayName: ({ _ }) => _("five minutes"),
    description: ({ _ }) => _("Slightly fuzzy time display"),
    value: 5,
  },
  {
    schemaValue: "10 minutes",
    displayName: ({ _ }) => _("ten minutes"),
    description: ({ _ }) => _("Moderately fuzzy time display"),
    value: 10,
  },
  {
    schemaValue: "15 minutes",
    displayName: ({ _ }) => _("fifteen minutes"),
    description: ({ _ }) => _("Most fuzzy time display"),
    value: 15,
  },
] as const;

/**
 * Configuration for divider text presets.
 *
 * Maps schema enum values to actual divider text strings, including
 * a special "custom" option that uses user-provided text.
 */
export const DIVIDER_PRESET_CONFIGS: readonly (
  | ValuePreferenceConfig<string>
  | CustomPreferenceConfig
)[] = [
  {
    schemaValue: "pipe",
    displayName: () => "┃", // Don't translate the symbol itself
    description: ({ _ }) => _("Vertical line divider"),
    value: " | ",
  },
  {
    schemaValue: "dot",
    displayName: () => "•", // Don't translate the symbol itself
    description: ({ _ }) => _("Bullet point divider"),
    value: " • ",
  },
  {
    schemaValue: "circle",
    displayName: () => "●", // Don't translate the symbol itself
    description: ({ _ }) => _("Filled circle divider"),
    value: " ● ",
  },
  {
    schemaValue: "dash",
    displayName: () => "—", // Don't translate the symbol itself
    description: ({ _ }) => _("Em dash divider"),
    value: " — ",
  },
  {
    schemaValue: "custom",
    displayName: ({ _ }) => _("Custom"),
    description: ({ _ }) => _("Use custom divider text"),
    isCustom: true,
  },
] as const;

/**
 * Generates a sample time display for a given time format.
 * Used to show dynamic examples using the current time.
 *
 * @param timeFormat - The time format to generate a sample for
 * @param translateFn - Translation functions for localization
 * @param fallback - Fallback string to return if sample generation fails
 * @returns A sample time string in the specified format, or the fallback if generation fails
 */
function generateSampleTime(
  timeFormat: TimeFormat,
  translateFn: GettextFunctions,
  fallback: string,
): string {
  try {
    const currentTime = new Date(); // Use current time instead of hardcoded
    const wordPack = createTranslatePack(translateFn);
    const formatter = new ClockFormatter(wordPack);

    const clockText = formatter.getClockText(
      currentTime,
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
 * Configuration for time format options.
 *
 * Maps schema enum values to time format identifiers with dynamic display
 * names that show sample time in each format.
 */
export const TIME_FORMAT_CONFIGS: readonly ValuePreferenceConfig<string>[] = [
  {
    schemaValue: "format-one",
    displayName: (gettext) => {
      const sample = generateSampleTime(
        TimeFormat.FORMAT_ONE,
        gettext,
        gettext._("Format One"),
      );
      return sample;
    },
    description: ({ _ }) => _("Standard time format"),
    value: "format-one",
  },
  {
    schemaValue: "format-two",
    displayName: (gettext) => {
      const sample = generateSampleTime(
        TimeFormat.FORMAT_TWO,
        gettext,
        gettext._("Format Two"),
      );
      return sample;
    },
    description: ({ _ }) => _("Alternative time format"),
    value: "format-two",
  },
] as const;

/**
 * Registry of all available accent color style configurations.
 *
 * Organized with monochrome styles first (work well with any display mode),
 * followed by multicolor styles (better with date/weekday visible).
 * Each configuration specifies color transformation functions for clock, date,
 * and divider elements.
 */
export const ACCENT_STYLE_CONFIGS: readonly AccentStyleConfig[] = [
  // Monochrome styles - work well with any display mode
  {
    schemaValue: "solid",
    displayName: ({ _ }) => _("Solid"),
    description: ({ _ }) => _("Time and date same color"),
    clockColor: (accent) => accent,
    dateColor: (accent) => accent,
    dividerColor: (accent) => accent,
  },
  {
    schemaValue: "light-variant",
    displayName: ({ _ }) => _("Light Variant"),
    description: ({ _ }) => _("All elements lighter"),
    clockColor: (accent) => accent.lighten(),
    dateColor: (accent) => accent.lighten(),
    dividerColor: (accent) => accent.lighten(),
  },
  {
    schemaValue: "dark-variant",
    displayName: ({ _ }) => _("Dark Variant"),
    description: ({ _ }) => _("All elements darker"),
    clockColor: (accent) => accent.darken(),
    dateColor: (accent) => accent.darken(),
    dividerColor: (accent) => accent.darken(),
  },
  // Multicolor styles - better with date/weekday visible
  {
    schemaValue: "duotone",
    displayName: ({ _ }) => _("Duotone"),
    description: ({ _ }) => _("Time lighter, date normal"),
    clockColor: (accent) => accent.lighten(),
    dateColor: (accent) => accent,
    dividerColor: (accent) => accent.lighten(),
  },
  {
    schemaValue: "racing-stripe",
    displayName: ({ _ }) => _("Racing Stripe"),
    description: ({ _ }) => _("Time/date solid, divider white"),
    clockColor: (accent) => accent,
    dateColor: (accent) => accent,
    dividerColor: () => new Color("#FFFFFF"),
  },
  {
    schemaValue: "racing-stripe-duotone",
    displayName: ({ _ }) => _("Racing Stripe Duotone"),
    description: ({ _ }) => _("Time lighter, date normal, divider white"),
    clockColor: (accent) => accent.lighten(),
    dateColor: (accent) => accent,
    dividerColor: () => new Color("#FFFFFF"),
  },
  {
    schemaValue: "contrast",
    displayName: ({ _ }) => _("Contrast"),
    description: ({ _ }) => _("Time white, date normal, divider white"),
    clockColor: () => new Color("#FFFFFF"),
    dateColor: (accent) => accent,
    dividerColor: (accent) => accent,
  },
  {
    schemaValue: "contrast-reverse",
    displayName: ({ _ }) => _("Contrast Reverse"),
    description: ({ _ }) => _("Time normal, date white, divider normal"),
    clockColor: (accent) => accent,
    dateColor: () => new Color("#FFFFFF"),
    dividerColor: () => new Color("#FFFFFF"),
  },
] as const;

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
 * Apply accent style transformation to a base color.
 *
 * Always applies the selected style consistently regardless of date visibility.
 * This ensures visual consistency - the clock color never changes unexpectedly
 * when toggling date/weekday visibility.
 *
 * @param baseColor - The base accent color to transform
 * @param styleIndex - GSettings enum index for the accent style
 * @returns Object with transformed colors for clock, date, and divider
 */
export function applyAccentStyle(baseColor: Color, styleIndex: number) {
  const config = getAccentStyleConfig(styleIndex);

  return {
    clockColor: config.clockColor(baseColor),
    dateColor: config.dateColor(baseColor),
    dividerColor: config.dividerColor(baseColor),
  };
}

/**
 * Get divider preset configuration by enum index.
 *
 * @param index - GSettings enum index (0-4)
 * @returns Divider preset configuration or first option if invalid
 */
export function getDividerPresetConfig(
  index: number,
): ValuePreferenceConfig<string> | CustomPreferenceConfig {
  return DIVIDER_PRESET_CONFIGS[index] || DIVIDER_PRESET_CONFIGS[0];
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
 * Unified registry of all preference configurations.
 *
 * Single source of truth that combines all preference types into one object.
 * Adding a new preference type here automatically makes it available throughout
 * the system for UI generation, validation, and schema mapping.
 */
export const PREFERENCE_CONFIGS = {
  FUZZINESS: FUZZINESS_CONFIGS,
  DIVIDER_PRESET: DIVIDER_PRESET_CONFIGS,
  TIME_FORMAT: TIME_FORMAT_CONFIGS,
  ACCENT_STYLE: ACCENT_STYLE_CONFIGS,
} as const;
