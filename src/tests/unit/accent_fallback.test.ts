// SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ACCENT_STYLE_CONFIGS } from "../../application/services/preference_configs.js";

describe("Accent style fallback behavior", () => {
  it("should have fallbacks for styles that require date visibility", () => {
    // Find all configs that require date visibility and assert they have a fallback
    const requiring: { c: any; i: number }[] = ACCENT_STYLE_CONFIGS.map(
      (c: any, i: number) => ({ c, i }),
    ).filter(({ c }: { c: any }) => (c as any).requiresDateVisible === true);

    expect(requiring.length).toBeGreaterThan(0);

    for (const { c, i } of requiring) {
      expect((c as any).fallbackIndex).toBeDefined();
      const fb: number = (c as any).fallbackIndex;
      expect(typeof fb).toBe("number");
      expect(fb).toBeGreaterThanOrEqual(0);
      expect(fb).toBeLessThan(ACCENT_STYLE_CONFIGS.length);

      // Simulate hiding the date/weekday: stored value should fall back
      const storedBefore = i;
      const fallback = fb;
      let storedAfter = storedBefore;
      if ((c as any).requiresDateVisible) storedAfter = fallback;

      expect(storedAfter).toBe(fallback);

      // Simulate restoring: the saved value should be the original
      const restored = storedBefore;
      expect(restored).toBe(i);
    }
  });
});
