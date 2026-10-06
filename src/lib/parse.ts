/** Helpers for reading untyped CWA JSON. */

export const toNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  const text = String(value).trim();
  // Number("") is 0, which would turn a blank CWA field into a real reading.
  if (!text) return undefined;
  const parsed = Number(text);
  // CWA marks missing readings with sentinels such as -99 and -999.
  if (!Number.isFinite(parsed) || parsed <= -90) return undefined;
  return parsed;
};

export const toText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export const asArray = <T = unknown>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value === undefined || value === null) return [];
  return [value as T];
};
