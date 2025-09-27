/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Configuration system for accent color style variations.
 *
 * This module provides a flexible, maintainable system for applying different
 * visual styles to the system accent color. Instead of hardcoding color logic
 * in switch statements, styles are defined as configuration objects with
 * transformation functions.
 *
 * The system decouples style definitions from settings enums, making it easy
 * to add new styles, modify existing ones, and maintain consistency across
 * the codebase.
 *
 * @example
 * ```typescript
 * import { applyAccentStyle } from './accent_style_config.js';
 * import { Color } from '../models/color.js';
 *
 * const accent = new Color('#3584E4'); // GNOME Blue
 * const styled = applyAccentStyle(accent, 3); // Racing Stripe style
 *
 * console.log(styled.clockColor);   // Color('#3584E4')  - solid
 * console.log(styled.dateColor);    // Color('#3584E4')  - solid
 * console.log(styled.dividerColor); // Color('#FFFFFF')  - white
 * ```
 */

import { Color } from "../models/color.js";

/**
 * Configuration specification for an accent color style variation.
 *
 * Defines how to transform a base accent color into clock, date, and divider
 * colors. Each style uses pure functions to ensure predictable, testable behavior.
 *
 * The functions receive the base accent color and return transformed Color instances,
 * allowing for complex color manipulations like lightening, darkening, or using
 * completely different colors (e.g., white dividers in "Racing Stripe" style).
 */
export interface AccentStyleConfig {
  /** Transform function for clock text color */
  clockColor: (accent: Color) => Color;

  /** Transform function for date text color */
  dateColor: (accent: Color) => Color;

  /** Transform function for divider color */
  dividerColor: (accent: Color) => Color;

  /** Human-readable name shown in preferences UI */
  name: string;

  /** Brief description of the style's visual effect */
  description: string;
}

/**
 * Registry of all available accent color style configurations.
 *
 * This array defines the complete set of accent styles available to users.
 * The array index directly corresponds to the GSettings enum value, creating
 * a stable mapping between UI selections and style implementations.
 *
 * Each configuration specifies:
 * - Color transformation functions for clock, date, and divider elements
 * - Human-readable name and description for the preferences UI
 * - Consistent visual behavior across different accent colors
 *
 * Styles range from subtle variations (Standard, Solid) to high-contrast
 * options (Racing Stripe) and accessibility-focused variants (Light/Dark).
 *
 * @readonly This array should not be modified at runtime
 */
export const ACCENT_STYLE_CONFIGS: readonly AccentStyleConfig[] = [
  {
    name: "Duotone",
    description: "Time lighter, date normal",
    clockColor: (accent) => accent.lighten(),
    dateColor: (accent) => accent,
    dividerColor: (accent) => accent.lighten(),
  },
  {
    name: "Solid",
    description: "Time and date same color",
    clockColor: (accent) => accent,
    dateColor: (accent) => accent,
    dividerColor: (accent) => accent,
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
    clockColor: (accent) => accent.lighten(),
    dateColor: (accent) => accent,
    dividerColor: () => new Color("#FFFFFF"),
  },
  {
    name: "Light Variant",
    description: "All elements lighter",
    clockColor: (accent) => accent.lighten(),
    dateColor: (accent) => accent.lighten(),
    dividerColor: (accent) => accent.lighten(),
  },
  {
    name: "Dark Variant",
    description: "All elements darker",
    clockColor: (accent) => accent.darken(),
    dateColor: (accent) => accent.darken(),
    dividerColor: (accent) => accent.darken(),
  },
] as const;

/**
 * Retrieves the accent style configuration for a given settings enum value.
 *
 * This function provides safe access to style configurations with automatic
 * fallback handling. Invalid indices (negative, non-integer, out-of-bounds)
 * are gracefully handled by returning the Standard style configuration.
 *
 * @param styleIndex - The GSettings enum value for the desired accent style (0-6)
 * @returns The corresponding AccentStyleConfig, or Standard style (index 0) if invalid
 *
 * @example
 * ```typescript
 * const config = getAccentStyleConfig(3);     // Racing Stripe style
 * const fallback = getAccentStyleConfig(-1);  // Returns Standard (index 0)
 * const invalid = getAccentStyleConfig(999);  // Returns Standard (index 0)
 *
 * console.log(config.name);     // "Racing Stripe"
 * console.log(fallback.name);   // "Standard"
 * console.log(invalid.name);    // "Standard"
 * ```
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
 * Applies an accent style configuration to transform a base accent color.
 *
 * This is the primary function for converting user accent color preferences
 * into the final colors used throughout the extension UI. It handles style
 * lookup, validation, and color transformation in a single operation.
 *
 * The function is designed to be safe and predictable:
 * - Invalid style indices automatically fall back to Standard style
 * - All color transformations are performed by pure functions
 * - Returns a consistent object structure for easy consumption
 *
 * @param accent - The base accent color to transform (typically from system settings)
 * @param styleIndex - The GSettings enum value for the desired style (0-6)
 * @returns Object containing the transformed clock, date, and divider colors
 *
 * @example
 * ```typescript
 * import { Color } from '../models/color.js';
 *
 * const systemAccent = new Color('#E62D42'); // GNOME Red
 *
 * // Apply different styles
 * const standard = applyAccentStyle(systemAccent, 0);
 * const solid = applyAccentStyle(systemAccent, 1);
 * const racing = applyAccentStyle(systemAccent, 3);
 *
 * console.log(standard.clockColor); // Lighter red
 * console.log(standard.dateColor);  // Original red
 *
 * console.log(solid.clockColor);    // Original red
 * console.log(solid.dateColor);     // Original red
 *
 * console.log(racing.clockColor);   // Original red
 * console.log(racing.dividerColor); // White (#FFFFFF)
 * ```
 */
export function applyAccentStyle(accent: Color, styleIndex: number) {
  const config = getAccentStyleConfig(styleIndex);

  return {
    clockColor: config.clockColor(accent),
    dateColor: config.dateColor(accent),
    dividerColor: config.dividerColor(accent),
  };
}
