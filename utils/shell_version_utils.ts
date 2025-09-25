/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Parse a GNOME Shell version string and return the major version number.
 * Examples handled:
 *  - "47.1"
 *  - "GNOME Shell 47.1"
 *  - "GNOME Shell 47"
 * Returns NaN if no major version could be parsed.
 */
export function parseGnomeShellVersionString(
  input: string | null | undefined,
): number {
  if (!input) return NaN;
  const s = String(input).trim();

  // Try to find a number sequence representing the major version
  // Match either "GNOME Shell 47.1" or just "47.1" etc.
  const re = /(?:GNOME Shell\s*)?(\d+)(?:\.|\b)/i;
  const m = s.match(re);
  if (!m) return NaN;
  const major = parseInt(m[1], 10);
  return Number.isNaN(major) ? NaN : major;
}

export default {
  parseGnomeShellVersionString,
};
