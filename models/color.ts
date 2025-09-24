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
   * Supports hex (#RRGGBB, #RGB) and rgb(...) formats.
   *
   * @param color The color string to validate and normalize.
   * @returns The normalized color string.
   * @throws Error if the color format is invalid.
   */
  static validateAndNormalize(color: string): string {
    // Validate hex color (#RRGGBB or #RGB)
    const hexMatch = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      return hex.length === 3
        ? `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase()
        : `#${hex}`.toUpperCase();
    }

    // Validate rgb(...) color
    const rgbMatch = color.match(
      /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
    );
    if (rgbMatch) {
      const r = Number(rgbMatch[1]);
      const g = Number(rgbMatch[2]);
      const b = Number(rgbMatch[3]);
      if ([r, g, b].every((v) => v >= 0 && v <= 255)) {
        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    throw new Error(`Invalid color format: ${color}`);
  }

  /**
   * Returns the normalized color string.
   */
  toString(): string {
    return this.normalized;
  }
}
