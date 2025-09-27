// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { extensionGettext } from "../../utils/gettext/gettext_utils_ext.js";
import { prefsGettext } from "../../utils/gettext/gettext_utils_prefs.js";

describe("Gettext Utils", () => {
  describe("extensionGettext", () => {
    it("should provide fallback _ function that returns input", () => {
      expect(extensionGettext._("Hello world")).toBe("Hello world");
      expect(extensionGettext._("Test message")).toBe("Test message");
      expect(extensionGettext._("")).toBe("");
    });

    it("should provide fallback ngettext function", () => {
      expect(extensionGettext.ngettext("item", "items", 1)).toBe("item");
      expect(extensionGettext.ngettext("item", "items", 0)).toBe("items");
      expect(extensionGettext.ngettext("item", "items", 2)).toBe("items");
      expect(extensionGettext.ngettext("item", "items", 42)).toBe("items");
    });

    it("should provide fallback pgettext function that ignores context", () => {
      expect(extensionGettext.pgettext("context", "message")).toBe("message");
      expect(extensionGettext.pgettext("", "message")).toBe("message");
      expect(extensionGettext.pgettext("any context", "")).toBe("");
    });

    it("should have all required gettext functions", () => {
      expect(typeof extensionGettext._).toBe("function");
      expect(typeof extensionGettext.ngettext).toBe("function");
      expect(typeof extensionGettext.pgettext).toBe("function");
    });
  });

  describe("prefsGettext", () => {
    it("should provide fallback _ function that returns input", () => {
      expect(prefsGettext._("Hello world")).toBe("Hello world");
      expect(prefsGettext._("Test message")).toBe("Test message");
      expect(prefsGettext._("")).toBe("");
    });

    it("should provide fallback ngettext function", () => {
      expect(prefsGettext.ngettext("item", "items", 1)).toBe("item");
      expect(prefsGettext.ngettext("item", "items", 0)).toBe("items");
      expect(prefsGettext.ngettext("item", "items", 2)).toBe("items");
      expect(prefsGettext.ngettext("item", "items", 42)).toBe("items");
    });

    it("should provide fallback pgettext function that ignores context", () => {
      expect(prefsGettext.pgettext("context", "message")).toBe("message");
      expect(prefsGettext.pgettext("", "message")).toBe("message");
      expect(prefsGettext.pgettext("any context", "")).toBe("");
    });

    it("should have all required gettext functions", () => {
      expect(typeof prefsGettext._).toBe("function");
      expect(typeof prefsGettext.ngettext).toBe("function");
      expect(typeof prefsGettext.pgettext).toBe("function");
    });
  });
});
