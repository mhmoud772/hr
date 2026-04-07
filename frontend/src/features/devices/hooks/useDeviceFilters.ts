import { useQueryState, parseAsString, parseAsInteger } from "nuqs";

/**
 * A custom hook to manage device filters and view modes using URL synchronization.
 */
export function useDeviceFilters() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsString.withDefault("all"));
  const [sortValue, setSortValue] = useQueryState("sort", parseAsString.withDefault("name:asc"));
  const [viewMode, setViewMode] = useQueryState("view", parseAsString.withDefault("grid"));

  const resetFilters = () => {
    setPage(1);
    setSearch("");
    setStatusFilter("all");
    setSortValue("name:asc");
  };

  return {
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortValue,
    setSortValue,
    viewMode: viewMode as "table" | "grid",
    setViewMode: (val: "table" | "grid") => setViewMode(val),
    resetFilters,
  };
}
