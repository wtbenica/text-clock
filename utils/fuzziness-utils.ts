import { Fuzziness } from "../clock_formatter.js";
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
