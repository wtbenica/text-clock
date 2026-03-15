// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { validateDate } from "../../../utils/error_utils.js";

describe("error_utils", () => {
  describe("validateDate", () => {
    it("does not throw for valid date", () => {
      expect(() => validateDate(new Date(), "context")).not.toThrow();
    });
    it("throws for invalid date", () => {
      expect(() => validateDate(new Date("invalid"), "context")).toThrow(
        /Invalid date/,
      );
    });
  });
});
