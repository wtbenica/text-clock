const ACCENT_MAP: Record<string, string> = {
  blue: "#3584E4",
  teal: "#2190A4",
  green: "#3A944A",
  yellow: "#C88800",
  orange: "#ED5B00",
  red: "#E62D42",
  pink: "#D56199",
  purple: "#9141AC",
  slate: "#6F8396",
};

export function accentNameToHex(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const s = String(value).trim().toLowerCase();
  const cleaned = s.replace(/^--?/, "").replace(/^accent-/, "");
  const parts = cleaned.split(/[-_\s]/).filter(Boolean);
  for (const p of parts) if (p in ACCENT_MAP) return ACCENT_MAP[p];
  if (cleaned in ACCENT_MAP) return ACCENT_MAP[cleaned];
  return undefined;
}
