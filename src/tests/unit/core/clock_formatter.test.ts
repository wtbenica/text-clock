// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import {
  ClockFormatter,
  Fuzziness,
  TimeFormat,
} from "../../../core/clock_formatter.js";
import { LocalizedStrings } from "../../../models/localized_strings.js";

// Mock translation strings for testing
const createMockWordPack = (): LocalizedStrings => {
  // Create a full 61-entry array for minutes 0-60
  const timesFormatOne = Array.from({ length: 61 }, (_, minute) => {
    if (minute === 0 || minute === 60) return "%s exactly";
    if (minute === 5) return "five past %s";
    if (minute === 10) return "ten past %s";
    if (minute === 15) return "quarter past %s";
    if (minute === 20) return "twenty past %s";
    if (minute === 25) return "twenty-five past %s";
    if (minute === 30) return "half past %s";
    if (minute === 35) return "twenty-five to %s";
    if (minute === 40) return "twenty to %s";
    if (minute === 45) return "quarter to %s";
    if (minute === 50) return "ten to %s";
    if (minute === 55) return "five to %s";
    return `${minute} past %s`; // fallback for other minutes
  });

  const timesFormatTwo = Array.from({ length: 61 }, (_, minute) => {
    if (minute === 0 || minute === 60) return "%s exactly";
    if (minute === 5) return "%s oh five";
    if (minute === 10) return "%s ten";
    if (minute === 15) return "%s fifteen";
    if (minute === 20) return "%s twenty";
    if (minute === 25) return "%s twenty-five";
    if (minute === 30) return "%s thirty";
    if (minute === 35) return "%s thirty-five";
    if (minute === 40) return "%s forty";
    if (minute === 45) return "%s forty-five";
    if (minute === 50) return "%s fifty";
    if (minute === 55) return "%s fifty-five";
    return `%s ${minute}`; // fallback for other minutes
  });

  return new LocalizedStrings({
    timesFormatOne,
    midnightFormatOne: "midnight",
    noonFormatOne: "noon",
    timesFormatTwo,
    midnightFormatTwo: "twelve",
    noonFormatTwo: "twelve",
    names: [
      "midnight",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "noon",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
    ],
    days: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    dayNames: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    dayOnly: "the %s",
    midnight: "midnight",
    noon: "noon",
    daysOfMonth: Array.from(
      { length: 31 },
      (_, i) => `${i + 1}${getOrdinalSuffix(i + 1)}`,
    ),
  });
};

// Helper function to get ordinal suffix
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

describe("ClockFormatter", () => {
  let formatter: ClockFormatter;
  let wordPack: LocalizedStrings;

  beforeEach(() => {
    wordPack = createMockWordPack();
    formatter = new ClockFormatter(wordPack);
  });

  describe("constructor", () => {
    it("should create a formatter with the provided word pack", () => {
      expect(formatter.wordPack).toBe(wordPack);
    });
  });

  describe("getClockText", () => {
    it("should format midnight correctly", () => {
      const date = new Date("2024-01-01T00:00:00");
      const result = formatter.getClockText(
        date,
        false,
        false,
        TimeFormat.FORMAT_ONE,
        5,
      );
      expect(result).toBe("midnight");
    });

    it("should format noon correctly", () => {
      const date = new Date("2024-01-01T12:00:00");
      const result = formatter.getClockText(
        date,
        false,
        false,
        TimeFormat.FORMAT_ONE,
        5,
      );
      expect(result).toBe("noon");
    });

    it("should format quarter past times correctly", () => {
      const date = new Date("2024-01-01T15:15:00"); // 3:15 PM
      const result = formatter.getClockText(
        date,
        false,
        false,
        TimeFormat.FORMAT_ONE,
        5,
      );
      expect(result).toBe("quarter past three");
    });

    it("should format half past times correctly", () => {
      const date = new Date("2024-01-01T09:30:00"); // 9:30 AM
      const result = formatter.getClockText(
        date,
        false,
        false,
        TimeFormat.FORMAT_ONE,
        5,
      );
      expect(result).toBe("half past nine");
    });

    it("should format quarter to times correctly", () => {
      const date = new Date("2024-01-01T14:45:00"); // 2:45 PM
      const result = formatter.getClockText(
        date,
        false,
        false,
        TimeFormat.FORMAT_ONE,
        5,
      );
      expect(result).toBe("quarter to three");
    });

    it("should include date when showDate is true", () => {
      const date = new Date("2024-01-01T15:00:00"); // Monday, Jan 1st, 3:00 PM
      const result = formatter.getClockText(
        date,
        true,
        false,
        TimeFormat.FORMAT_ONE,
        5,
      );
      expect(result).toContain(" | ");
      expect(result).toContain("the 1st");
    });

    it("should include weekday when showWeekday is true", () => {
      const date = new Date("2024-01-01T15:00:00"); // Monday, Jan 1st, 3:00 PM
      const result = formatter.getClockText(
        date,
        true,
        true,
        TimeFormat.FORMAT_ONE,
        5,
      );
      expect(result).toContain("Monday");
    });

    it("should handle format two correctly", () => {
      const date = new Date("2024-01-01T15:15:00"); // 3:15 PM
      const result = formatter.getClockText(
        date,
        false,
        false,
        TimeFormat.FORMAT_TWO,
        5,
      );
      expect(result).toBe("three fifteen");
    });

    it("should handle different fuzziness levels", () => {
      const date = new Date("2024-01-01T15:17:00"); // 3:17 PM

      // With 5-minute fuzziness, should round to 15
      const result5 = formatter.getClockText(
        date,
        false,
        false,
        TimeFormat.FORMAT_ONE,
        5,
      );
      expect(result5).toBe("quarter past three");

      // With 10-minute fuzziness, should round to 20
      const result10 = formatter.getClockText(
        date,
        false,
        false,
        TimeFormat.FORMAT_ONE,
        10,
      );
      expect(result10).toBe("twenty past three");
    });

    it("should handle hour rollover correctly", () => {
      const date = new Date("2024-01-01T23:55:00"); // 11:55 PM
      const result = formatter.getClockText(
        date,
        false,
        false,
        TimeFormat.FORMAT_ONE,
        5,
      );
      expect(result).toBe("five to midnight");
    });

    it("should handle date rollover when rounding to next day", () => {
      const date = new Date("2024-01-31T23:58:00"); // 11:58 PM on Jan 31st - rounds to midnight
      const result = formatter.getClockText(
        date,
        true,
        false,
        TimeFormat.FORMAT_ONE,
        5,
      );
      expect(result).toContain("the 1st"); // Should show Feb 1st
    });
  });

  describe("edge cases", () => {
    it("should throw error for invalid date", () => {
      const date = new Date("invalid");
      expect(() => {
        formatter.getClockText(date, false, false, TimeFormat.FORMAT_ONE, 5);
      }).toThrow("ClockFormatter.getClockText: Invalid date provided");
    });

    it("should throw error for zero fuzziness", () => {
      const date = new Date("2024-01-01T15:17:00");
      expect(() => {
        formatter.getClockText(
          date,
          false,
          false,
          TimeFormat.FORMAT_ONE,
          0 as any,
        );
      }).toThrow("Fuzziness must be a positive number");
    });

    it("should handle large fuzziness values", () => {
      const date = new Date("2024-01-01T15:17:00");
      const result = formatter.getClockText(
        date,
        false,
        false,
        TimeFormat.FORMAT_ONE,
        Fuzziness.FIFTEEN_MINUTES,
      );
      // With 15-minute fuzziness, 15:17 should round to 15:15
      expect(result).toBe("quarter past three");
    });
  });
});
