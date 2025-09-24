import { normalizeColor, escapeMarkup } from "../../utils/color_utils";

describe("normalizeColor", () => {
  it("returns #ffffff for empty input", () => {
    expect(normalizeColor("")).toBe("#ffffff");
  });

  it("normalizes rgb() format", () => {
    expect(normalizeColor("rgb(255, 0, 128)")).toBe("#ff0080");
    expect(normalizeColor("rgb(0, 0, 0)")).toBe("#000000");
    expect(normalizeColor("rgb(300, -10, 20)")).toBe("#ff0014"); // clamps values
  });

  it("normalizes hex format with #", () => {
    expect(normalizeColor("#abc")).toBe("#abc");
    expect(normalizeColor("#123456")).toBe("#123456");
  });

  it("normalizes hex format without #", () => {
    expect(normalizeColor("abc")).toBe("#abc");
    expect(normalizeColor("123456")).toBe("#123456");
  });

  it("returns #ffffff for invalid color", () => {
    expect(normalizeColor("notacolor")).toBe("#ffffff");
  });
});

describe("escapeMarkup", () => {
  it("escapes &, <, >", () => {
    expect(escapeMarkup("a & b <c>")).toBe("a &amp; b &lt;c&gt;");
  });

  it("returns unchanged string if no markup", () => {
    expect(escapeMarkup("plain text")).toBe("plain text");
  });
});
