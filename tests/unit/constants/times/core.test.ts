// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { createTimeConstants } from "../../../../constants/times/core.js";
import type { GettextFunctions } from "../../../../utils/gettext_utils.js";

describe("createTimeConstants", () => {
  let mockGettextFunctions: GettextFunctions;
  let pgetextSpy: jest.SpyInstance;
  let timeConstants: ReturnType<typeof createTimeConstants>;

  beforeEach(() => {
    pgetextSpy = jest.fn(
      (context: string, message: string) => `translated:${message}`,
    );

    mockGettextFunctions = {
      _: jest.fn((s: string) => `translated:${s}`),
      ngettext: jest.fn((s: string, p: string, n: number) => (n === 1 ? s : p)),
      pgettext: pgetextSpy as any,
    };

    timeConstants = createTimeConstants(mockGettextFunctions);
  });

  describe("timesFormatOne", () => {
    it("should return exactly 61 time formats", () => {
      const times = timeConstants.timesFormatOne();
      expect(times).toHaveLength(61);
    });

    it("should start and end with o'clock format", () => {
      const times = timeConstants.timesFormatOne();
      expect(times[0]).toBe("translated:%s o'clock");
      expect(times[60]).toBe("translated:%s o'clock");
    });

    it("should have quarter past at index 15", () => {
      const times = timeConstants.timesFormatOne();
      expect(times[15]).toBe("translated:quarter past %s");
    });

    it("should have half past at index 30", () => {
      const times = timeConstants.timesFormatOne();
      expect(times[30]).toBe("translated:half past %s");
    });

    it("should have quarter to at index 45", () => {
      const times = timeConstants.timesFormatOne();
      expect(times[45]).toBe("translated:quarter to %s");
    });

    it("should call pgettext with correct context for all formats", () => {
      timeConstants.timesFormatOne();
      expect(pgetextSpy).toHaveBeenCalledWith("format one", "%s o'clock");
      expect(pgetextSpy).toHaveBeenCalledWith("format one", "five past %s");
      expect(pgetextSpy).toHaveBeenCalledWith("format one", "quarter past %s");
      expect(pgetextSpy).toHaveBeenCalledWith("format one", "half past %s");
      expect(pgetextSpy).toHaveBeenCalledWith("format one", "quarter to %s");
    });

    it("should have proper minute progression from past to to", () => {
      const times = timeConstants.timesFormatOne();

      // Check some key transitions
      expect(times[1]).toBe("translated:one past %s");
      expect(times[29]).toBe("translated:twenty nine past %s");
      expect(times[31]).toBe("translated:twenty nine to %s");
      expect(times[59]).toBe("translated:one to %s");
    });
  });

  describe("timesFormatTwo", () => {
    it("should return exactly 61 time formats", () => {
      const times = timeConstants.timesFormatTwo();
      expect(times).toHaveLength(61);
    });

    it("should start and end with o'clock format", () => {
      const times = timeConstants.timesFormatTwo();
      expect(times[0]).toBe("translated:%s o'clock");
      expect(times[60]).toBe("translated:%s o'clock");
    });

    it("should have oh formats for single digit minutes", () => {
      const times = timeConstants.timesFormatTwo();
      expect(times[1]).toBe("translated:%s oh one");
      expect(times[5]).toBe("translated:%s oh five");
      expect(times[9]).toBe("translated:%s oh nine");
    });

    it("should have thirty at index 30", () => {
      const times = timeConstants.timesFormatTwo();
      expect(times[30]).toBe("translated:%s thirty");
    });

    it("should call pgettext with correct context for all formats", () => {
      timeConstants.timesFormatTwo();
      expect(pgetextSpy).toHaveBeenCalledWith("format two", "%s o'clock");
      expect(pgetextSpy).toHaveBeenCalledWith("format two", "%s oh five");
      expect(pgetextSpy).toHaveBeenCalledWith("format two", "%s fifteen");
      expect(pgetextSpy).toHaveBeenCalledWith("format two", "%s thirty");
    });
  });

  describe("hourNames", () => {
    it("should return exactly 24 hour names", () => {
      const hours = timeConstants.hourNames();
      expect(hours).toHaveLength(24);
    });

    it("should start with midnight and have noon at index 12", () => {
      const hours = timeConstants.hourNames();
      expect(hours[0]).toBe("translated:midnight");
      expect(hours[12]).toBe("translated:noon");
    });

    it("should have proper hour progression", () => {
      const hours = timeConstants.hourNames();
      expect(hours[1]).toBe("translated:one");
      expect(hours[11]).toBe("translated:eleven");
      expect(hours[13]).toBe("translated:one"); // 1 PM
      expect(hours[23]).toBe("translated:eleven"); // 11 PM
    });

    it("should call pgettext with time context for each hour", () => {
      timeConstants.hourNames();
      expect(pgetextSpy).toHaveBeenCalledWith("00:00 / 12:00 AM", "midnight");
      expect(pgetextSpy).toHaveBeenCalledWith("01:00 / 01:00 AM", "one");
      expect(pgetextSpy).toHaveBeenCalledWith("12:00 / 12:00 PM", "noon");
      expect(pgetextSpy).toHaveBeenCalledWith("13:00 / 01:00 PM", "one");
    });
  });

  describe("special time constants", () => {
    it("should return correct midnight format one", () => {
      const midnight = timeConstants.midnightFormatOne();
      expect(midnight).toBe("translated:midnight");
      expect(pgetextSpy).toHaveBeenCalledWith(
        "Should be able to replace %s in format one templates",
        "midnight",
      );
    });

    it("should return correct noon format one", () => {
      const noon = timeConstants.noonFormatOne();
      expect(noon).toBe("translated:noon");
      expect(pgetextSpy).toHaveBeenCalledWith(
        "Must be able to replace %s in format one templates",
        "noon",
      );
    });

    it("should return correct midnight format two", () => {
      const midnight = timeConstants.midnightFormatTwo();
      expect(midnight).toBe("translated:twelve");
      expect(pgetextSpy).toHaveBeenCalledWith(
        "Must be able to replace %s in format two templates",
        "twelve",
      );
    });

    it("should return correct noon format two", () => {
      const noon = timeConstants.noonFormatTwo();
      expect(noon).toBe("translated:twelve");
      expect(pgetextSpy).toHaveBeenCalledWith(
        "Must be able to replace %s in format two templates",
        "twelve",
      );
    });

    it("should return exact midnight", () => {
      const midnight = timeConstants.midnight();
      expect(midnight).toBe("translated:midnight");
      expect(pgetextSpy).toHaveBeenCalledWith("exactly midnight", "midnight");
    });

    it("should return exact noon", () => {
      const noon = timeConstants.noon();
      expect(noon).toBe("translated:noon");
      expect(pgetextSpy).toHaveBeenCalledWith("exactly noon", "noon");
    });
  });

  describe("function behavior", () => {
    it("should return functions that can be called multiple times", () => {
      const times1 = timeConstants.timesFormatOne();
      const times2 = timeConstants.timesFormatOne();

      expect(times1).toEqual(times2);
      expect(times1).not.toBe(times2); // Different instances
    });

    it("should use provided gettext functions consistently", () => {
      // Call multiple functions to verify they all use the same gettext instance
      timeConstants.timesFormatOne();
      timeConstants.timesFormatTwo();
      timeConstants.hourNames();

      // Should have called our mock pgettext function many times
      expect(pgetextSpy.mock.calls.length).toBeGreaterThan(100);
    });
  });

  describe("edge cases", () => {
    it("should handle gettext functions that return original strings", () => {
      const passthroughGettext: GettextFunctions = {
        _: (s: string) => s,
        ngettext: (s: string, p: string, n: number) => (n === 1 ? s : p),
        pgettext: (context: string, message: string) => message,
      };

      const constants = createTimeConstants(passthroughGettext);
      const times = constants.timesFormatOne();

      expect(times[0]).toBe("%s o'clock");
      expect(times[15]).toBe("quarter past %s");
    });

    it("should work with gettext functions that throw errors", () => {
      const errorGettext: GettextFunctions = {
        _: jest.fn().mockImplementation(() => {
          throw new Error("Translation error");
        }),
        ngettext: jest.fn().mockImplementation(() => {
          throw new Error("Translation error");
        }),
        pgettext: jest.fn().mockImplementation(() => {
          throw new Error("Translation error");
        }),
      };

      expect(() => createTimeConstants(errorGettext)).not.toThrow();
      expect(() =>
        createTimeConstants(errorGettext).timesFormatOne(),
      ).toThrow();
    });
  });
});
