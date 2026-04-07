import type { ApiListLike } from "@/types/contracts";

export type UnknownRecord = Record<string, unknown>;

export const asRecord = (value: unknown): UnknownRecord =>
  typeof value === "object" && value !== null ? (value as UnknownRecord) : {};

export const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
};

export const toRequiredString = (value: unknown, fallback = ""): string =>
  toOptionalString(value) ?? fallback;

export const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
};

export const toOptionalRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const toOptionalStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value
      .map((item) => toOptionalString(item))
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        return toOptionalStringArray(JSON.parse(trimmed)) ?? [];
      } catch {
        return [trimmed];
      }
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
};

export const toOptionalId = (value: unknown): string | undefined => {
  const normalized = toOptionalString(value);
  return normalized === undefined ? undefined : normalized;
};

export const toOptionalReferenceId = (value: unknown): string | undefined => {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return /^\d+$/.test(trimmed) ? trimmed : undefined;
  }
  return undefined;
};

export function normalizePaginatedList<TRaw, T>(
  data: ApiListLike<TRaw>,
  normalizeItem: (item: TRaw) => T,
) {
  if (Array.isArray(data)) {
    return {
      results: data.map(normalizeItem),
      count: data.length,
    };
  }

  const rawResults = Array.isArray(data?.results) ? data.results : [];
  return {
    results: rawResults.map(normalizeItem),
    count: typeof data?.count === "number" ? data.count : rawResults.length,
  };
}
