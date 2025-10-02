/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { normalizeColor } from "../../utils/color/color_utils.js";

/**
 * Represents a color with validation and utility methods.
 *
 * Supports hex (#RGB, #RRGGBB) and RGB (rgb(r,g,b)) color formats.
 * All colors are normalized to uppercase hex format for consistency.
 *
 * @example
 * ```typescript
 * const blue = new Color("#3584E4");
 * const fromRgb = new Color("rgb(53, 132, 228)");
 * const lighter = blue.lighten(0.3);
 * const darker = blue.darken(0.2);
 * console.log(blue.toString()); // "#3584E4"
 * ```
 */
export class Color {
  /** The normalized hex color string (always uppercase #RRGGBB format) */
  private readonly hex: string;

  /**
   * Creates a new Color instance from a color string.
   *
   * @param color - The color string (hex #RGB/#RRGGBB or rgb(r,g,b) format)
   * @throws {Error} When the color format is invalid
   */
  constructor(color: string) {
    this.hex = Color.validateAndNormalize(color);
  }

  /**
   * Validates and normalizes a color string.
   *
   * Accepts hex (#RGB, #RRGGBB) and RGB (rgb(r,g,b)) formats, normalizing to uppercase #RRGGBB.
   * Uses the normalizeColor utility for format conversion, then validates and uppercases the result.
   *
   * @param color - The color string to validate and normalize
   * @returns The normalized hex color string (uppercase #RRGGBB)
   * @throws {Error} When the color format is invalid
   *
   * @example
   * ```typescript
   * Color.validateAndNormalize("#abc");           // "#AABBCC"
   * Color.validateAndNormalize("#123456");        // "#123456"
   * Color.validateAndNormalize("rgb(255,0,0)");   // "#FF0000"
   * ```
   */
  static validateAndNormalize(color: string): string {
    // Check if the input is recognizable as a color format
    const isValidFormat =
      color &&
      (/^#?[0-9a-fA-F]{3,6}$/.test(color.trim()) ||
        /^rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(color.trim()));

    if (!isValidFormat) {
      throw new Error(`Invalid color format: ${color}`);
    }

    const normalized = normalizeColor(color);

    // Convert to uppercase and expand 3-digit hex if needed
    const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!hexMatch) {
      throw new Error(`Invalid color format: ${color}`);
    }

    const hex = hexMatch[1];
    return hex.length === 3
      ? `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase()
      : `#${hex}`.toUpperCase();
  }

  /**
   * Returns the normalized hex color string.
   *
   * @returns The color as an uppercase hex string (#RRGGBB format)
   *
   * @example
   * ```typescript
   * const color = new Color("#abc");
   * console.log(color.toString()); // "#AABBCC"
   * ```
   */
  toString(): string {
    return this.hex;
  }

  /**
   * Creates a lighter version of the color by blending with white.
   *
   * Uses mathematical RGB blending: newValue = original + (255 - original) * amount
   *
   * @param amount - The lightening amount (0-1, where 0 = no change, 1 = white). Defaults to 0.3
   * @returns A new Color instance representing the lighter color
   *
   * @example
   * ```typescript
   * const blue = new Color("#0000FF");
   * const lightBlue = blue.lighten(0.3); // 30% lighter
   * const veryLight = blue.lighten(0.8); // 80% lighter
   * ```
   */
  lighten(amount = 0.3): Color {
    const r = parseInt(this.hex.slice(1, 3), 16);
    const g = parseInt(this.hex.slice(3, 5), 16);
    const b = parseInt(this.hex.slice(5, 7), 16);

    const nr = Math.round(r + (255 - r) * amount);
    const ng = Math.round(g + (255 - g) * amount);
    const nb = Math.round(b + (255 - b) * amount);

    const hex = `#${nr.toString(16).padStart(2, "0")}${ng
      .toString(16)
      .padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`.toUpperCase();

    return new Color(hex);
  }

  /**
   * Creates a darker version of the color by reducing each RGB channel.
   *
   * Uses mathematical RGB blending: newValue = original * (1 - amount)
   *
   * @param amount - The darkening amount (0-1, where 0 = no change, 1 = black). Defaults to 0.2
   * @returns A new Color instance representing the darker color
   *
   * @example
   * ```typescript
   * const blue = new Color("#0000FF");
   * const darkBlue = blue.darken(0.2); // 20% darker
   * const veryDark = blue.darken(0.7); // 70% darker
   * ```
   */
  darken(amount = 0.2): Color {
    const r = parseInt(this.hex.slice(1, 3), 16);
    const g = parseInt(this.hex.slice(3, 5), 16);
    const b = parseInt(this.hex.slice(5, 7), 16);

    const nr = Math.round(r * (1 - amount));
    const ng = Math.round(g * (1 - amount));
    const nb = Math.round(b * (1 - amount));

    const hex = `#${nr.toString(16).padStart(2, "0")}${ng
      .toString(16)
      .padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`.toUpperCase();

    return new Color(hex);
  }
}
