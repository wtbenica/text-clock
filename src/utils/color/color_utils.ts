/* Utility functions for color handling (moved) */
export function normalizeColor(color: string): string {
  if (!color) return "#ffffff";
  color = color.trim();
  const rgbMatch = color.match(
    /rgb\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/i,
  );
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, Number(rgbMatch[1])));
    const g = Math.max(0, Math.min(255, Number(rgbMatch[2])));
    const b = Math.max(0, Math.min(255, Number(rgbMatch[3])));
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  }
  const hexMatch = color.match(/^#?[0-9a-f]{3,6}$/i);
  if (hexMatch) return color.startsWith("#") ? color : `#${color}`;
  return "#ffffff";
}

export function escapeMarkup(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
