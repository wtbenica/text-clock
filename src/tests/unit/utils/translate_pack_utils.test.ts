// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { createTimeConstants } from "../../../constants/times/core.js";
import { createDateConstants } from "../../../constants/dates/core.js";
import { createTranslatePack } from "../../../utils/translate/translate_pack_utils.js";
import { LocalizedStrings } from "../../../models/localized_strings.js";

describe("translate_pack_utils", () => {
  const mockGettext = {
    _: (msgid: string) => msgid,
    ngettext: (msgid: string, msgid_plural: string, n: number) =>
      n === 1 ? msgid : msgid_plural,
    pgettext: (msgctxt: string, msgid: string) => msgid,
  };

  describe("createTranslatePack", () => {
    it("should create a LocalizedStrings instance", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack).toBeInstanceOf(LocalizedStrings);
    });

    it("should include all required time format one strings", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.timesFormatOne).toHaveLength(61);
    });

    it("should include all required time format two strings", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.timesFormatTwo).toHaveLength(61);
    });

    it("should include midnight and noon strings for format one", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.midnightFormatOne).toBeDefined();
      expect(typeof pack.midnightFormatOne).toBe("string");
      expect(pack.noonFormatOne).toBeDefined();
      expect(typeof pack.noonFormatOne).toBe("string");
    });

    it("should include midnight and noon strings for format two", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.midnightFormatTwo).toBeDefined();
      expect(typeof pack.midnightFormatTwo).toBe("string");
      expect(pack.noonFormatTwo).toBeDefined();
      expect(typeof pack.noonFormatTwo).toBe("string");
    });

    it("should include hour names (0-23)", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.names).toHaveLength(24);
    });

    it("should include weekday abbreviations", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.days).toHaveLength(7);
    });

    it("should include full weekday names", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.dayNames).toHaveLength(7);
    });

    it("should include date-only format string", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.dayOnly).toBeDefined();
      expect(typeof pack.dayOnly).toBe("string");
    });

    it("should include midnight and noon standalone strings", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.midnight).toBeDefined();
      expect(typeof pack.midnight).toBe("string");
      expect(pack.noon).toBeDefined();
      expect(typeof pack.noon).toBe("string");
    });

    it("should include days of month (31 entries)", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.daysOfMonth).toHaveLength(31);
    });

    it("should use gettext functions for translation", () => {
      const customGettext = {
        _: jest.fn((msgid: string) => `translated_${msgid}`),
        ngettext: jest.fn((msgid: string, msgid_plural: string, n: number) =>
          n === 1 ? msgid : msgid_plural,
        ),
        pgettext: jest.fn((msgctxt: string, msgid: string) => `ctx_${msgid}`),
      };

      const pack = createTranslatePack(customGettext);

      // Verify gettext was called (it should be called many times for all the strings)
      expect(customGettext._).toHaveBeenCalled();
    });

    it("should create consistent packs with same gettext input", () => {
      const pack1 = createTranslatePack(mockGettext);
      const pack2 = createTranslatePack(mockGettext);

      expect(pack1.timesFormatOne).toEqual(pack2.timesFormatOne);
      expect(pack1.timesFormatTwo).toEqual(pack2.timesFormatTwo);
      expect(pack1.names).toEqual(pack2.names);
      expect(pack1.days).toEqual(pack2.days);
    });
  });

  describe("time expressions should have expected counts", () => {
    it("should have 61 time expressions for each minute 0-60", () => {
      const timeConstants = createTimeConstants(mockGettext);

      expect(timeConstants.timesFormatOne()).toHaveLength(61);
      expect(timeConstants.timesFormatTwo()).toHaveLength(61);
    });
  });

  describe("date constants should have expected counts", () => {
    it("should have 7 weekday abbreviations", () => {
      const dateConstants = createDateConstants(mockGettext);
      expect(dateConstants.weekdays()).toHaveLength(7);
    });

    it("should have 7 full weekday names", () => {
      const dateConstants = createDateConstants(mockGettext);
      expect(dateConstants.weekdayNames()).toHaveLength(7);
    });

    it("should have 31 days of month", () => {
      const dateConstants = createDateConstants(mockGettext);
      expect(dateConstants.daysOfMonth()).toHaveLength(31);
    });
  });
});
