// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Parsing utilities for fuzziness enum conversion.
 */

import { Fuzziness } from "../core/clock_formatter.js";

/**
 * Convert GSettings enum index to Fuzziness enum value.
 * Defaults to FIVE_MINUTES for invalid indices.
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
 * Parse Fuzziness from string or enum value.
 * Defaults to FIVE_MINUTES for invalid input.
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
