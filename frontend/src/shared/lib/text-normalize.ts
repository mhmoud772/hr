// Helpers to fix mojibake (UTF-8 bytes shown as ISO-8859-1) that appears as "Ø§Ù„" etc.
// We mutate objects/arrays in place to avoid extra allocations and keep axios/i18n data shapes intact.
export const deMojibake = (value: string): string => {
  if (typeof value !== "string") return value;

  // Try classic escape/unescape (handles %uXXXX)
  try {
    const fixed = unescape(escape(value));
    if (/[\u0600-\u06FF]/.test(fixed)) return fixed;
  } catch {
    /* ignore */
  }

  // Fallback: decodeURIComponent path for strings that were shown as UTF-8 bytes in Latin-1
  try {
    const fixed = decodeURIComponent(escape(value));
    if (/[\u0600-\u06FF]/.test(fixed)) return fixed;
  } catch {
    /* ignore */
  }

  // Last-resort: treat each charCode as a raw byte and decode as UTF-8
  try {
    const bytes = Uint8Array.from([...value].map((c) => c.charCodeAt(0) & 0xff).filter((b) => b !== 0));
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (/[\u0600-\u06FF]/.test(decoded)) return decoded;
  } catch {
    /* ignore */
  }

  return value;
};

export const normalizeStringsDeep = <T>(input: T): T => {
  if (typeof input === "string") return deMojibake(input) as unknown as T;
  if (Array.isArray(input)) {
    return input.map((item) => normalizeStringsDeep(item)) as unknown as T;
  }
  if (input && typeof input === "object") {
    const clone: Record<string, unknown> = { ...(input as Record<string, unknown>) };
    Object.keys(clone).forEach((key) => {
      clone[key] = normalizeStringsDeep(clone[key]);
    });
    return clone as unknown as T;
  }
  return input;
};
