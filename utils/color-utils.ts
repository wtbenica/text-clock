/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Utility functions for color handling
 */

/**
 * Normalizes a color string to hex format
 *
 * @param color - The color string to normalize
 * @returns The normalized hex color string
 */
export function normalizeColor(color: string): string {
  if (!color) return "#ffffff";
  color = color.trim();

  // Handle rgb() format
  const rgbMatch = color.match(
    /rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i,
  );
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, Number(rgbMatch[1])));
    const g = Math.max(0, Math.min(255, Number(rgbMatch[2])));
    const b = Math.max(0, Math.min(255, Number(rgbMatch[3])));
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  }

  // Handle hex format (with or without #)
  const hexMatch = color.match(/^#?[0-9a-f]{3,6}$/i);
  if (hexMatch) {
    return color.startsWith("#") ? color : `#${color}`;
  }

  return "#ffffff"; // fallback
}

/**
 * Escapes markup characters for Pango markup
 *
 * @param text - The text to escape
 * @returns The escaped text
 */
export function escapeMarkup(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
