/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Represents a color with validation, normalization, and utility methods.
 */
export class Color {
  private readonly normalized: string;

  constructor(color: string) {
    this.normalized = Color.validateAndNormalize(color);
  }

  /**
   * Validates and normalizes a color string.
   * Supports hex (#RRGGBB, #RGB), rgb(...) formats, CSS custom properties, and GNOME Shell theme properties.
   *
   * @param color The color string to validate and normalize.
   * @returns The normalized color string.
   * @throws Error if the color format is invalid.
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
   * Returns the normalized color string.
   */
  toString(): string {
    return this.normalized;
  }

  /**
   * Lighten the color by blending with white.
   * amount is fraction between 0 and 1 (default 0.2)
   */
  lighten(amount = 0.3): Color {
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
   * Darken the color by blending with black.
   * amount is fraction between 0 and 1 (default 0.2)
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
