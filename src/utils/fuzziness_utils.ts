import { Fuzziness } from "../core/clock_formatter.js";
import { FUZZINESS_ENUM_MINUTES } from "../constants/index.js";

/**
 * Maps a fuzziness enum index to its corresponding Fuzziness value
 *
 * @param index - The index from the settings enum
 * @returns The corresponding Fuzziness value
 */
export function fuzzinessFromEnumIndex(index: number): Fuzziness {
  const minutes = FUZZINESS_ENUM_MINUTES[index] ?? 5;
  switch (minutes) {
    case 1:
      return Fuzziness.ONE_MINUTE;
    case 5:
      return Fuzziness.FIVE_MINUTES;
    case 10:
      return Fuzziness.TEN_MINUTES;
    case 15:
      return Fuzziness.FIFTEEN_MINUTES;
    default:
      return Fuzziness.FIVE_MINUTES;
  }
}

/**
 * Parses a fuzziness value from string or number to Fuzziness enum
 *
 * @param value - The value to parse
 * @returns The parsed Fuzziness value
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
    return Fuzziness.FIVE_MINUTES; // fallback
  }
  return value;
}
