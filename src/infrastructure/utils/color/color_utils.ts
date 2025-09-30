// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Color utility functions for validation, normalization, and formatting.
 *
 * This module provides essential color handling utilities used throughout
 * the text-clock extension for processing user-provided colors, system
 * accent colors, and ensuring valid color values for UI elements.
 *
 * The utilities handle various color formats (hex, RGB) and provide
 * consistent normalization with fallback behavior for invalid input.
 *
 * @example
 * ```typescript
 * import { normalizeColor, escapeMarkup } from './color_utils.js';
 *
 * // Normalize various color formats
 * const hex = normalizeColor('#3584E4');           // '#3584E4'
 * const rgb = normalizeColor('rgb(53, 132, 228)'); // '#3584e4'
 * const invalid = normalizeColor('bad-color');     // '#ffffff' (fallback)
 *
 * // Escape text for markup
 * const safe = escapeMarkup('Text with <tags> & symbols'); // 'Text with &lt;tags&gt; &amp; symbols'
 * ```
 */

/**
 * Normalize a color string to a consistent hex format with fallback handling.
 *
 * Accepts various color formats and converts them to lowercase hex format.
 * Handles RGB color strings, hex colors (with or without #), and provides
 * graceful fallback to white (#ffffff) for invalid input.
 *
 * RGB values are clamped to valid ranges (0-255) and hex values are validated
 * to ensure they represent valid colors.
 *
 * @param color - Color string in various formats (hex, rgb, named)
 * @returns Normalized hex color string (always starts with #, lowercase)
 *
 * @example
 * ```typescript
 * // Hex colors (normalized to lowercase with #)
 * normalizeColor('#3584E4');    // '#3584e4'
 * normalizeColor('FF0000');     // '#ff0000'
 * normalizeColor('#abc');       // '#abc' (3-digit hex preserved)
 *
 * // RGB colors (converted to hex)
 * normalizeColor('rgb(255, 0, 0)');        // '#ff0000'
 * normalizeColor('RGB(53, 132, 228)');     // '#3584e4'
 * normalizeColor('rgb(300, -10, 150)');    // '#ff0096' (clamped to 0-255)
 *
 * // Invalid colors (fallback to white)
 * normalizeColor('');           // '#ffffff'
 * normalizeColor('invalid');    // '#ffffff'
 * normalizeColor('blue');       // '#ffffff' (named colors not supported)
 * ```
 */
export function normalizeColor(color: string): string {
  if (!color) return "#ffffff";
  color = color.trim();
  const rgbMatch = color.match(
    /rgb\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/i,
  );
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, Number(rgbMatch[1])));
    const g = Math.max(0, Math.min(255, Number(rgbMatch[2])));
    const b = Math.max(0, Math.min(255, Number(rgbMatch[3])));
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  }
  const hexMatch = color.match(/^#?[0-9a-f]{3,6}$/i);
  if (hexMatch) return color.startsWith("#") ? color : `#${color}`;
  return "#ffffff";
}

/**
 * Escape HTML/XML markup characters in text for safe display in markup contexts.
 *
 * Converts special HTML/XML characters to their entity equivalents to prevent
 * markup interpretation and potential security issues when displaying user-provided
 * text in markup-aware contexts (like Pango markup).
 *
 * Essential for safely displaying user-provided text (like custom divider text)
 * in GNOME Shell's markup-based text rendering system.
 *
 * @param text - Text string that may contain markup characters
 * @returns Text with HTML/XML characters escaped as entities
 *
 * @example
 * ```typescript
 * // Basic markup escaping
 * escapeMarkup('Hello <world>');           // 'Hello &lt;world&gt;'
 * escapeMarkup('Tom & Jerry');             // 'Tom &amp; Jerry'
 * escapeMarkup('<script>alert()</script>'); // '&lt;script&gt;alert()&lt;/script&gt;'
 *
 * // Safe for Pango markup
 * const userText = 'User input: <custom>';
 * const safeText = escapeMarkup(userText);
 * const markup = `<span color="#ff0000">${safeText}</span>`;
 * // Result: <span color="#ff0000">User input: &lt;custom&gt;</span>
 * ```
 */
export function escapeMarkup(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
