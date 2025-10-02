/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Color } from "../domain/models/color.js";
import type {
  ValuePreferenceConfig,
  CustomPreferenceConfig,
  AccentStyleConfig,
} from "../domain/models/preference_types.js";

/**
 * Static preference configuration data.
 *
 * This module contains all the preference option definitions used throughout
 * the extension. These are implementation details that should not be exported
 * directly - access them through the preference service instead.
 */

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
 * Configuration for time format options.
 *
 * Maps schema enum values to format identifiers. Display names are generated
 * dynamically by the preference service when needed.
 */
export const TIME_FORMAT_CONFIGS: readonly ValuePreferenceConfig<string>[] = [
  {
    schemaValue: "format-one",
    displayName: ({ _ }) => _("Format One"),
    description: ({ _ }) => _("Standard time format"),
    value: "format-one",
  },
  {
    schemaValue: "format-two",
    displayName: ({ _ }) => _("Format Two"),
    description: ({ _ }) => _("Alternative time format"),
    value: "format-two",
  },
] as const;

/**
 * Configuration for accent color style variations.
 *
 * Defines color transformation functions for different visual accent styles.
 * The first 3 are monochrome styles, the rest are multicolor styles.
 */
export const ACCENT_STYLE_CONFIGS: readonly AccentStyleConfig[] = [
  // Monochrome styles - work well with any display mode
  {
    schemaValue: "solid",
    displayName: ({ _ }) => _("Accent"),
    description: ({ _ }) => _("Time and date same color"),
    clockColor: (accent) => accent,
    dateColor: (accent) => accent,
    dividerColor: (accent) => accent,
  },
  {
    schemaValue: "light-variant",
    displayName: ({ _ }) => _("Accent Light"),
    description: ({ _ }) => _("All elements lighter"),
    clockColor: (accent) => accent.lighten(),
    dateColor: (accent) => accent.lighten(),
    dividerColor: (accent) => accent.lighten(),
  },
  {
    schemaValue: "dark-variant",
    displayName: ({ _ }) => _("Accent Dark"),
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
    dividerColor: (accent) => accent,
  },
] as const;
