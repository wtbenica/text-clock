import {
  logDebug,
  logErr,
  logInfo,
  logWarn,
  validateDate,
} from "../../../../infrastructure/utils/error_utils.js";

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

  describe("log wrappers", () => {
    // Mock GNOME Shell log and logError as no-ops
    let origLog = (global as any).log;
    let origLogError = (global as any).logError;
    beforeAll(() => {
      (global as any).log = () => {};
      (global as any).logError = () => {};
    });
    afterAll(() => {
      (global as any).log = origLog;
      (global as any).logError = origLogError;
    });
    it("logErr does not throw", () => {
      expect(() => logErr("err", "ctx")).not.toThrow();
    });
    it("logWarn does not throw", () => {
      expect(() => logWarn("warn", "ctx")).not.toThrow();
    });
    it("logInfo does not throw", () => {
      expect(() => logInfo("info", "ctx")).not.toThrow();
    });
    it("logDebug does not throw", () => {
      expect(() => logDebug("debug", "ctx")).not.toThrow();
    });
  });
});
