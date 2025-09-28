import {
  fuzzinessFromEnumIndex,
  parseFuzziness,
} from "../../utils/parse_utils.js";
import { Fuzziness } from "../../core/clock_formatter.js";

// Mock getFuzzinessConfig for testing
jest.mock("../../services/preference_configs.js", () => ({
  getFuzzinessConfig: (index: number) => {
    const configs = [
      { value: 1 }, // index 0
      { value: 5 }, // index 1
      { value: 10 }, // index 2
      { value: 15 }, // index 3
    ];
    return configs[index] || { value: 5 }; // fallback
  },
}));

describe("fuzzinessFromEnumIndex", () => {
  it("returns correct Fuzziness for valid indices", () => {
    expect(fuzzinessFromEnumIndex(0)).toBe(Fuzziness.ONE_MINUTE);
    expect(fuzzinessFromEnumIndex(1)).toBe(Fuzziness.FIVE_MINUTES);
    expect(fuzzinessFromEnumIndex(2)).toBe(Fuzziness.TEN_MINUTES);
    expect(fuzzinessFromEnumIndex(3)).toBe(Fuzziness.FIFTEEN_MINUTES);
  });

  it("returns FIVE_MINUTES for out-of-range index", () => {
    expect(fuzzinessFromEnumIndex(99)).toBe(Fuzziness.FIVE_MINUTES);
  });
});

describe("parseFuzziness", () => {
  it("parses string to Fuzziness", () => {
    expect(parseFuzziness(String(Fuzziness.ONE_MINUTE))).toBe(
      Fuzziness.ONE_MINUTE,
    );
    expect(parseFuzziness(String(Fuzziness.FIFTEEN_MINUTES))).toBe(
      Fuzziness.FIFTEEN_MINUTES,
    );
  });

  it("returns FIVE_MINUTES for invalid string", () => {
    expect(parseFuzziness("notanumber")).toBe(Fuzziness.FIVE_MINUTES);
  });

  it("returns value unchanged if already Fuzziness", () => {
    expect(parseFuzziness(Fuzziness.TEN_MINUTES)).toBe(Fuzziness.TEN_MINUTES);
  });
});
