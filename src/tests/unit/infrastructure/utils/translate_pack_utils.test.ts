// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { createTimeConstants } from "../../../../infrastructure/constants/times/core.js";

describe("createTranslatePack", () => {
  describe("time expressions should have expected counts", () => {
    it("should have 61 time expressions for each minute 0-60", () => {
      // Create a mock gettext implementation
      const mockGettext = {
        _: (msgid: string) => msgid,
        ngettext: (msgid: string, msgid_plural: string, n: number) =>
          n === 1 ? msgid : msgid_plural,
        pgettext: (msgctxt: string, msgid: string) => msgid,
      };

      const timeConstants = createTimeConstants(mockGettext);

      expect(timeConstants.timesFormatOne()).toHaveLength(61);
      expect(timeConstants.timesFormatTwo()).toHaveLength(61);
    });
  });
});
