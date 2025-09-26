export function parseGnomeShellVersionString(
  input: string | null | undefined,
): number {
  if (!input) return NaN;
  const s = String(input).trim();
  const re = /(?:GNOME Shell\s*)?(\d+)(?:\.|\b)/i;
  const m = s.match(re);
  if (!m) return NaN;
  const major = parseInt(m[1], 10);
  return Number.isNaN(major) ? NaN : major;
}

export default {
  parseGnomeShellVersionString,
};
