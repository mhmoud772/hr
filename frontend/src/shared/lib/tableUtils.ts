type SortDirection = "asc" | "desc";

export const parseSortValue = (value: string): { key: string; direction: SortDirection } => {
  const [key, dir] = value.split(":");
  return { key, direction: dir === "desc" ? "desc" : "asc" };
};

export const sortRows = <T>(
  rows: T[],
  key: string,
  direction: SortDirection,
  selectors?: Record<string, (row: T) => unknown>,
): T[] => {
  const getter: (row: T) => unknown =
    selectors?.[key] ?? ((row: T) => (row as Record<string, unknown>)[key]);
  const sorted = [...rows].sort((a, b) => {
    const av = getter(a);
    const bv = getter(b);

    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;

    if (typeof av === "string" && typeof bv === "string") {
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return direction === "asc" ? cmp : -cmp;
    }

    const cmp = av > bv ? 1 : av < bv ? -1 : 0;
    return direction === "asc" ? cmp : -cmp;
  });

  return sorted;
};
