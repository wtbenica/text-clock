/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Represents a color with validation, normalization, and utility methods.
 *
 * The Color class provides a robust way to handle colors in the text-clock extension,
 * supporting various input formats and providing utility methods for color manipulation.
 * All colors are normalized to consistent formats to ensure reliable operations.
 *
 * @example
 * ```typescript
 * const blue = new Color("#3584E4");
 * const lighter = blue.lighten(0.3);
 * const darker = blue.darken(0.2);
 * console.log(blue.toString()); // "#3584E4"
 * ```
 */
export class Color {
  /** The normalized color string representation */
  private readonly normalized: string;

  /**
   * Creates a new Color instance from a color string.
   *
   * @param color - The color string to parse (hex, rgb, rgba formats supported)
   * @throws {Error} When the color format is invalid or unsupported
   */
  constructor(color: string) {
    this.normalized = Color.validateAndNormalize(color);
  }

  /**
   * Validates and normalizes a color string to a consistent format.
   *
   * This method accepts hex (#RRGGBB, #RGB) and rgb/rgba functional notation,
   * converting them to normalized formats. CSS variables and theme properties
   * are not accepted as they prevent numeric color operations.
   *
   * @param color - The color string to validate and normalize
   * @returns The normalized color string (hex colors are uppercase)
   * @throws {Error} When the color format is invalid, unsupported, or contains invalid RGB values
   *
   * @example
   * ```typescript
   * Color.validateAndNormalize("#abc");     // "#AABBCC"
   * Color.validateAndNormalize("#123456");  // "#123456"
   * Color.validateAndNormalize("rgb(255, 0, 0)"); // "rgb(255, 0, 0)"
   * ```
   */
  static validateAndNormalize(color: string): string {
    // Only accept concrete color formats (hex or rgb/rgba).

    // Validate hex color (#RRGGBB or #RGB)
    const hexMatch = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      return hex.length === 3
        ? `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase()
        : `#${hex}`.toUpperCase();
    }

    // Validate rgb(...) and rgba(...) colors
    const rgbMatch = color.match(
      /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*[\d.]+)?\)$/,
    );
    if (rgbMatch) {
      const r = Number(rgbMatch[1]);
      const g = Number(rgbMatch[2]);
      const b = Number(rgbMatch[3]);
      if ([r, g, b].every((v) => v >= 0 && v <= 255)) {
        return color; // Return as-is for rgba
      }
    }

    // Do not accept CSS variables or theme properties here. They are not concrete
    // color values and prevent numeric operations like lighten/darken.

    throw new Error(`Invalid color format: ${color}`);
  }

  /**
   * Returns the normalized color string representation.
   *
   * @returns The color as a normalized string (hex format is uppercase)
   *
   * @example
   * ```typescript
   * const color = new Color("#abc");
   * console.log(color.toString()); // "#AABBCC"
   * ```
   */
  toString(): string {
    return this.normalized;
  }

  /**
   * Creates a lighter version of the color by blending with white.
   *
   * For hex colors, this performs mathematical RGB blending. For other formats,
   * this uses CSS color-mix() expressions where supported.
   *
   * @param amount - The lightening amount (0-1, where 0 = no change, 1 = white). Defaults to 0.5
   * @returns A new Color instance representing the lighter color
   *
   * @example
   * ```typescript
   * const blue = new Color("#0000FF");
   * const lightBlue = blue.lighten(0.3); // 30% lighter
   * const veryLight = blue.lighten(0.8); // 80% lighter
   * ```
   */
  lighten(amount = 0.5): Color {
    const s = this.normalized;
    // If hex, compute numeric blend
    if (s.startsWith("#")) {
      const r = parseInt(s.slice(1, 3), 16);
      const g = parseInt(s.slice(3, 5), 16);
      const b = parseInt(s.slice(5, 7), 16);
      const nr = Math.round(r + (255 - r) * amount);
      const ng = Math.round(g + (255 - g) * amount);
      const nb = Math.round(b + (255 - b) * amount);
      const hex = `#${nr.toString(16).padStart(2, "0")}${ng
        .toString(16)
        .padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`.toUpperCase();
      return new Color(hex);
    }

    // For CSS variables or theme properties, return a color-mix CSS expression
    const pct = Math.round(amount * 100);
    const keep = 100 - pct;
    return new Color(`color-mix(in srgb, ${s} ${keep}%, white ${pct}%)`);
  }

  /**
   * Creates a darker version of the color by blending with black.
   *
   * For hex colors, this performs mathematical RGB blending by reducing each
   * channel proportionally. For other formats, this uses CSS color-mix() expressions.
   *
   * @param amount - The darkening amount (0-1, where 0 = no change, 1 = black). Defaults to 0.3
   * @returns A new Color instance representing the darker color
   *
   * @example
   * ```typescript
   * const blue = new Color("#0000FF");
   * const darkBlue = blue.darken(0.2); // 20% darker
   * const veryDark = blue.darken(0.7); // 70% darker
   * ```
   */
  darken(amount = 0.3): Color {
    const s = this.normalized;
    if (s.startsWith("#")) {
      const r = parseInt(s.slice(1, 3), 16);
      const g = parseInt(s.slice(3, 5), 16);
      const b = parseInt(s.slice(5, 7), 16);
      const nr = Math.round(r * (1 - amount));
      const ng = Math.round(g * (1 - amount));
      const nb = Math.round(b * (1 - amount));
      const hex = `#${nr.toString(16).padStart(2, "0")}${ng
        .toString(16)
        .padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`.toUpperCase();
      return new Color(hex);
    }

    const pct = Math.round(amount * 100);
    const keep = 100 - pct;
    return new Color(`color-mix(in srgb, ${s} ${keep}%, black ${pct}%)`);
  }
}
