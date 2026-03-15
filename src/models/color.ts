/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** Color validation and manipulation. Supports hex and rgb() formats, normalized to #RRGGBB. */
export class Color {
  /** Normalized hex color (uppercase #RRGGBB) */
  private readonly hex: string;

  /** @param color - Hex (#RGB/#RRGGBB) or rgb(r,g,b) format */
  constructor(color: string) {
    this.hex = Color.validateAndNormalize(color);
  }

  /** Validate and normalize color to uppercase #RRGGBB. Throws on invalid format. */
  static validateAndNormalize(color: string): string {
    if (!color) {
      throw new Error(`Invalid color format: ${color}`);
    }

    color = color.trim();

    // Handle RGB format
    const rgbMatch = color.match(
      /rgb\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/i,
    );
    if (rgbMatch) {
      const r = Number(rgbMatch[1]);
      const g = Number(rgbMatch[2]);
      const b = Number(rgbMatch[3]);

      // Validate RGB values are in range
      if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
        throw new Error(`RGB values must be 0-255, got rgb(${r}, ${g}, ${b})`);
      }

      const hex =
        "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
      return hex.toUpperCase();
    }

    // Handle hex format
    const hexMatch = color.match(/^#?[0-9a-f]{3,6}$/i);
    if (hexMatch) {
      const normalizedHex = color.startsWith("#") ? color : `#${color}`;
      const hex = normalizedHex.slice(1);
      return hex.length === 3
        ? `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase()
        : `#${hex}`.toUpperCase();
    }

    throw new Error(`Invalid color format: ${color}`);
  }

  /** Get the color as an uppercase hex string (#RRGGBB). */
  toString(): string {
    return this.hex;
  }

  /**
   * Lighten by blending with white: newValue = original + (255 - original) * amount
   * @param amount - 0 (no change) to 1 (white). Default: 0.3
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
   * Darken by reducing RGB channels: newValue = original * (1 - amount)
   * @param amount - 0 (no change) to 1 (black). Default: 0.2
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
