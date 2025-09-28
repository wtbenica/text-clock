import { createTranslatePack } from "../../../../infrastructure/utils/translate/translate_pack_utils.js";
import { WordPack } from "../../../../word_pack.js";

describe("createTranslatePack", () => {
  it("returns a WordPack with expected keys", () => {
    // Mock GettextFunctions
    const gettextFns = {
      _: (s: string) => s,
      ngettext: (s: string, p: string, n: number) => (n === 1 ? s : p),
      pgettext: (c: string, s: string) => s,
    };
    const pack = createTranslatePack(gettextFns);
    expect(pack).toBeInstanceOf(WordPack);
    expect(Array.isArray(pack.timesFormatOne)).toBe(true);
    expect(typeof pack.midnightFormatOne).toBe("string");
    expect(typeof pack.noonFormatOne).toBe("string");
    expect(Array.isArray(pack.timesFormatTwo)).toBe(true);
    expect(typeof pack.midnightFormatTwo).toBe("string");
    expect(typeof pack.noonFormatTwo).toBe("string");
    expect(Array.isArray(pack.names)).toBe(true);
    expect(Array.isArray(pack.days)).toBe(true);
    expect(typeof pack.dayOnly).toBe("string");
    expect(typeof pack.midnight).toBe("string");
    expect(typeof pack.noon).toBe("string");
    expect(Array.isArray(pack.daysOfMonth)).toBe(true);
  });
});
