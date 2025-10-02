// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Utilities for converting GNOME accent color names to hex values.
 */

/**
 * GNOME accent color names mapped to hex values.
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
 * Convert GNOME accent color name to hex value.
 * Normalizes case and whitespace for simple color name lookup.
 */
export function accentNameToHex(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return ACCENT_MAP[normalized];
}
