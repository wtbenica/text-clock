/*
 * Mapping of GNOME accent color names to hex values.
 * Values provided by user; preserved here as uppercase hex.
 */
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

/**
 * Convert a stored accent-color value to a hex string if possible.
 * Accepts inputs like "yellow", "accent-yellow", "--accent-yellow", or the
 * full CSS variable name. Returns undefined if no mapping is found.
 */
export function accentNameToHex(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const s = String(value).trim().toLowerCase();

  // Strip common prefixes
  const cleaned = s.replace(/^--?/, "").replace(/^accent-/, "");

  // Also allow values like "-st-accent-color" or "--accent-blue"
  const parts = cleaned.split(/[-_\s]/).filter(Boolean);
  // Find any part that matches our map keys
  for (const p of parts) {
    if (p in ACCENT_MAP) return ACCENT_MAP[p];
  }

  // As a last attempt, check the whole cleaned string
  if (cleaned in ACCENT_MAP) return ACCENT_MAP[cleaned];

  return undefined;
}

export default null;
