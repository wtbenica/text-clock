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

    it("should include all required time format strings (61 entries for minutes 0-60)", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.timesFormatOne).toHaveLength(61);
      expect(pack.timesFormatTwo).toHaveLength(61);
    });

    it("should include hour names (24 entries for hours 0-23)", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.names).toHaveLength(24);
    });

    it("should include weekday data", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.days).toHaveLength(7);
      expect(pack.dayNames).toHaveLength(7);
    });

    it("should include days of month (31 entries)", () => {
      const pack = createTranslatePack(mockGettext);
      expect(pack.daysOfMonth).toHaveLength(31);
    });

    it("should call gettext functions for translation", () => {
      const customGettext = {
        _: jest.fn((msgid: string) => msgid),
        ngettext: jest.fn((msgid: string, msgid_plural: string, n: number) =>
          n === 1 ? msgid : msgid_plural,
        ),
        pgettext: jest.fn((msgctxt: string, msgid: string) => msgid),
      };

      createTranslatePack(customGettext);

      expect(customGettext._).toHaveBeenCalled();
      expect(customGettext.pgettext).toHaveBeenCalled();
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
