import {
  logErr,
  logWarn,
  logInfo,
  logDebug,
  safeExecute,
  validateRequired,
  validateDate,
  withErrorHandling,
} from "../../utils/error_utils";

describe("error_utils", () => {
  describe("safeExecute", () => {
    it("returns result when function succeeds", () => {
      expect(safeExecute(() => 42, "context")).toBe(42);
    });
    it("returns fallback when function throws", () => {
      expect(
        safeExecute(
          () => {
            throw new Error("fail");
          },
          "context",
          "fallback",
        ),
      ).toBe("fallback");
    });
    it("returns undefined when function throws and no fallback", () => {
      expect(
        safeExecute(() => {
          throw new Error("fail");
        }, "context"),
      ).toBeUndefined();
    });
  });

  describe("validateRequired", () => {
    it("does not throw for valid value", () => {
      expect(() => validateRequired(1, "value")).not.toThrow();
    });
    it("throws for null/undefined", () => {
      expect(() => validateRequired(null, "value")).toThrow(/Required value/);
      expect(() => validateRequired(undefined, "value")).toThrow(
        /Required value/,
      );
    });
  });

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

  describe("withErrorHandling", () => {
    it("returns result when function succeeds", () => {
      const fn = withErrorHandling("op", (x: number) => x + 1);
      expect(fn(1)).toBe(2);
    });
    it("returns undefined and logs when function throws", () => {
      const fn = withErrorHandling("op", () => {
        throw new Error("fail");
      });
      expect(fn()).toBeUndefined();
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
