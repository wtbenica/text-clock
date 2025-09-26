/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Configuration system for accent color style variations.
 *
 * This decouples the accent style logic from the settings enum,
 * making it easier to maintain and extend with new styles.
 */

import { Color } from "../models/color.js";

/**
 * Configuration for an accent color style variation
 */
export interface AccentStyleConfig {
  /** Function to generate clock color from accent color */
  clockColor: (accent: Color) => Color;
  /** Function to generate date color from accent color */
  dateColor: (accent: Color) => Color;
  /** Function to generate divider color from accent color */
  dividerColor: (accent: Color) => Color;
  /** Human-readable name for this style */
  name: string;
  /** Description of what this style does */
  description: string;
}

/**
 * Registry of all available accent color styles.
 * The array index corresponds to the GSettings enum value.
 */
export const ACCENT_STYLE_CONFIGS: readonly AccentStyleConfig[] = [
  {
    name: "Standard",
    description: "Time lighter, date normal",
    clockColor: (accent) => accent.lighten(0.3),
    dateColor: (accent) => accent,
    dividerColor: (accent) => accent.lighten(0.3),
  },
  {
    name: "Solid",
    description: "Time and date same color",
    clockColor: (accent) => accent,
    dateColor: (accent) => accent,
    dividerColor: (accent) => accent,
  },
  {
    name: "Duotone",
    description: "Time lighter, date normal",
    clockColor: (accent) => accent.lighten(0.3),
    dateColor: (accent) => accent,
    dividerColor: (accent) => accent.lighten(0.3),
  },
  {
    name: "Racing Stripe",
    description: "Time/date solid, divider white",
    clockColor: (accent) => accent,
    dateColor: (accent) => accent,
    dividerColor: () => new Color("#FFFFFF"),
  },
  {
    name: "Racing Stripe Duotone",
    description: "Time lighter, date normal, divider white",
    clockColor: (accent) => accent.lighten(0.3),
    dateColor: (accent) => accent,
    dividerColor: () => new Color("#FFFFFF"),
  },
  {
    name: "Light Variant",
    description: "All elements lighter",
    clockColor: (accent) => accent.lighten(0.5),
    dateColor: (accent) => accent.lighten(0.3),
    dividerColor: (accent) => accent.lighten(0.5),
  },
  {
    name: "Dark Variant",
    description: "All elements darker",
    clockColor: (accent) => accent.darken(0.2),
    dateColor: (accent) => accent.darken(0.1),
    dividerColor: (accent) => accent.darken(0.2),
  },
] as const;

/**
 * Get the accent style configuration for a given enum value.
 *
 * @param styleIndex The GSettings enum value for the accent style
 * @returns The accent style configuration, or the default (Standard) if invalid
 */
export function getAccentStyleConfig(styleIndex: number): AccentStyleConfig {
  // Validate index is a valid integer within bounds
  if (
    Number.isInteger(styleIndex) &&
    styleIndex >= 0 &&
    styleIndex < ACCENT_STYLE_CONFIGS.length
  ) {
    return ACCENT_STYLE_CONFIGS[styleIndex];
  }

  return ACCENT_STYLE_CONFIGS[0]; // Standard fallback
}

/**
 * Apply an accent style configuration to an accent color.
 *
 * @param accent The base accent color
 * @param styleIndex The GSettings enum value for the accent style
 * @returns Object with the generated clock, date, and divider colors
 */
export function applyAccentStyle(accent: Color, styleIndex: number) {
  const config = getAccentStyleConfig(styleIndex);

  return {
    clockColor: config.clockColor(accent),
    dateColor: config.dateColor(accent),
    dividerColor: config.dividerColor(accent),
  };
}
