/**
 * Parsing utilities for converting between different data formats.
 *
 * This module provides utility functions for parsing and converting data types
 * used throughout the text-clock extension. It handles conversions between
 * enum indices, string values, and strongly-typed enum values.
 *
 * The utilities ensure type safety while providing graceful handling of
 * invalid input with sensible fallbacks.
 *
 * @example
 * ```typescript
 * import { fuzzinessFromEnumIndex, parseFuzziness, parseGnomeShellVersionString } from './parse_utils.js';
 *
 * // Convert GSettings enum index to Fuzziness
 * const fuzziness = fuzzinessFromEnumIndex(2); // Fuzziness.TEN_MINUTES
 *
 * // Parse string or enum value
 * const parsed = parseFuzziness("5"); // Fuzziness.FIVE_MINUTES
 *
 * // Extract GNOME Shell version
 * const version = parseGnomeShellVersionString("GNOME Shell 45.1"); // 45
 * ```
 */

import { Fuzziness } from "../core/clock_formatter.js";

/**
 * Convert a GSettings enum index to the corresponding Fuzziness enum value.
 *
 * Maps the GSettings schema enum index (as stored in dconf) to the strongly-typed
 * Fuzziness enum used throughout the codebase. Handles invalid indices gracefully
 * by falling back to the default 5-minute fuzziness.
 *
 * Direct mapping from schema enum indices to Fuzziness enum values for reliability.
 *
 * @param index - The GSettings enum index (0-3 for 1, 5, 10, 15 minutes respectively)
 * @returns The corresponding Fuzziness enum value, defaults to FIVE_MINUTES for invalid indices
 *
 * @example
 * ```typescript
 * const fuzziness = fuzzinessFromEnumIndex(0); // Fuzziness.ONE_MINUTE
 * const defaultFuzz = fuzzinessFromEnumIndex(1); // Fuzziness.FIVE_MINUTES
 * const tenMin = fuzzinessFromEnumIndex(2);     // Fuzziness.TEN_MINUTES
 * const fifteenMin = fuzzinessFromEnumIndex(3); // Fuzziness.FIFTEEN_MINUTES
 * const invalid = fuzzinessFromEnumIndex(999);  // Fuzziness.FIVE_MINUTES (fallback)
 * ```
 */
export function fuzzinessFromEnumIndex(index: number): Fuzziness {
  switch (index) {
    case 0:
      return Fuzziness.ONE_MINUTE;
    case 1:
      return Fuzziness.FIVE_MINUTES;
    case 2:
      return Fuzziness.TEN_MINUTES;
    case 3:
      return Fuzziness.FIFTEEN_MINUTES;
    default:
      return Fuzziness.FIVE_MINUTES;
  }
}

/**
 * Parse a Fuzziness value from string or enum, with fallback handling.
 *
 * Accepts either a Fuzziness enum value (pass-through) or a string representation
 * of the fuzziness in minutes. For strings, attempts to parse as integer and validate
 * against known Fuzziness enum values.
 *
 * Provides graceful fallback to FIVE_MINUTES for invalid or unparseable input.
 *
 * @param value - Fuzziness enum value or string representation (e.g., "5", "10")
 * @returns Valid Fuzziness enum value, defaults to FIVE_MINUTES for invalid input
 *
 * @example
 * ```typescript
 * // Pass-through enum values
 * const direct = parseFuzziness(Fuzziness.TEN_MINUTES); // Fuzziness.TEN_MINUTES
 *
 * // Parse valid string values
 * const fromString = parseFuzziness("15");              // Fuzziness.FIFTEEN_MINUTES
 * const oneMin = parseFuzziness("1");                   // Fuzziness.ONE_MINUTE
 *
 * // Fallback for invalid input
 * const invalid = parseFuzziness("30");                 // Fuzziness.FIVE_MINUTES
 * const badString = parseFuzziness("abc");              // Fuzziness.FIVE_MINUTES
 * ```
 */
export function parseFuzziness(value: Fuzziness | string): Fuzziness {
  if (typeof value === "string") {
    const parsed = parseInt(value);
    if (
      !Number.isNaN(parsed) &&
      Object.values(Fuzziness).includes(parsed as Fuzziness)
    ) {
      return parsed as Fuzziness;
    }
    return Fuzziness.FIVE_MINUTES;
  }
  return value;
}

/**
 * Extract the major version number from a GNOME Shell version string.
 *
 * Parses various GNOME Shell version string formats to extract the major version
 * number. Handles different string formats including official version strings,
 * simple version numbers, and malformed input.
 *
 * Used for version-specific compatibility checks and feature detection.
 *
 * @param input - Version string to parse (e.g., "GNOME Shell 45.1", "46", "47.0-beta")
 * @returns Major version number, or NaN if parsing fails
 *
 * @example
 * ```typescript
 * // Standard GNOME Shell version strings
 * const v45 = parseGnomeShellVersionString("GNOME Shell 45.1");    // 45
 * const v46 = parseGnomeShellVersionString("GNOME Shell 46.0");    // 46
 *
 * // Simple version numbers
 * const simple = parseGnomeShellVersionString("47");               // 47
 * const withDot = parseGnomeShellVersionString("48.2");            // 48
 *
 * // Beta/development versions
 * const beta = parseGnomeShellVersionString("47.0-beta");          // 47
 *
 * // Invalid input handling
 * const invalid = parseGnomeShellVersionString("not a version");   // NaN
 * const nullInput = parseGnomeShellVersionString(null);            // NaN
 *
 * // Usage for compatibility checks
 * const version = parseGnomeShellVersionString(shellVersion);
 * if (version >= 45) {
 *   // Use modern APIs
 * }
 * ```
 */
export function parseGnomeShellVersionString(
  input: string | null | undefined,
): number {
  if (!input) return NaN;
  const s = String(input).trim();
  const re = /(?:GNOME Shell\s*)?(\d+)(?:\.|\b)/i;
  const m = s.match(re);
  if (!m) return NaN;
  const major = parseInt(m[1], 10);
  return Number.isNaN(major) ? NaN : major;
}
