// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Utilities for handling GNOME's accent color system.
 *
 * This module provides functions for converting GNOME's named accent colors
 * to concrete hex color values. GNOME uses named tokens like "blue", "teal",
 * "green" etc. to represent accent colors, and this module maps those names
 * to their corresponding hex values.
 *
 * The mapping handles various naming conventions and formats that may be
 * encountered in different GNOME versions or configurations.
 *
 * @example
 * ```typescript
 * import { accentNameToHex } from './accent_color_utils.js';
 *
 * // Map named accent colors to hex values
 * const blue = accentNameToHex('blue');        // '#3584E4'
 * const green = accentNameToHex('green');      // '#3A944A'
 * const teal = accentNameToHex('teal');        // '#2190A4'
 *
 * // Handle various naming formats
 * const withPrefix = accentNameToHex('accent-red');    // '#E62D42'
 * const withDashes = accentNameToHex('--purple');      // '#9141AC'
 * const mixed = accentNameToHex('accent_yellow');      // '#C88800'
 * ```
 */

/**
 * Mapping of GNOME accent color names to their corresponding hex values.
 *
 * These colors match GNOME's official accent color palette as defined in
 * the GNOME desktop interface settings. The hex values are the standard
 * colors used throughout GNOME applications and the shell.
 */
const ACCENT_MAP: Record<string, string> = {
  blue: "#3584E4",
  teal: "#2190A4",
  green: "#3A944A",
  yellow: "#C88800",
  orange: "#ED5B00",
  red: "#E62D42",
  pink: "#D56199",
  purple: "#9141AC",
  slate: "#6F8396",
};

/**
 * Convert a GNOME accent color name to its corresponding hex color value.
 *
 * Maps GNOME's named accent colors to concrete hex values for use in styling.
 * Handles various naming conventions including prefixes ("accent-", "--"),
 * different separators (hyphens, underscores, spaces), and mixed formats.
 *
 * The function performs flexible matching by:
 * - Normalizing case (converts to lowercase)
 * - Removing common prefixes ("--", "accent-")
 * - Splitting on various separators and checking each part
 * - Falling back to direct name lookup
 *
 * @param value - Accent color name or formatted string from GNOME settings
 * @returns Hex color string if the name is recognized, undefined otherwise
 *
 * @example
 * ```typescript
 * // Direct color names
 * accentNameToHex('blue');     // '#3584E4'
 * accentNameToHex('green');    // '#3A944A'
 * accentNameToHex('red');      // '#E62D42'
 *
 * // With various prefixes and formats
 * accentNameToHex('accent-teal');      // '#2190A4'
 * accentNameToHex('--purple');         // '#9141AC'
 * accentNameToHex('accent_orange');    // '#ED5B00'
 * accentNameToHex('accent-color-pink'); // '#D56199'
 *
 * // Case insensitive
 * accentNameToHex('YELLOW');   // '#C88800'
 * accentNameToHex('Slate');    // '#6F8396'
 *
 * // Unknown colors
 * accentNameToHex('unknown');  // undefined
 * accentNameToHex('');         // undefined
 * accentNameToHex(null);       // undefined
 * ```
 */
export function accentNameToHex(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const s = String(value).trim().toLowerCase();
  const cleaned = s.replace(/^--?/, "").replace(/^accent-/, "");
  const parts = cleaned.split(/[-_\s]/).filter(Boolean);
  for (const p of parts) if (p in ACCENT_MAP) return ACCENT_MAP[p];
  if (cleaned in ACCENT_MAP) return ACCENT_MAP[cleaned];
  return undefined;
}
