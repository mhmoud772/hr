import { useMemo } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { useEmployeesQuery } from "@/features/employees/hooks/useEmployees";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";

/**
 * A custom hook to manage filters and date transitions for the Attendance report and records list.
 */
export function useAttendanceFilters() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
  const [department, setDepartment] = useQueryState("department", parseAsString.withDefault("all"));
  const [employee, setEmployee] = useQueryState("employee", parseAsString.withDefault("all"));
  const [startDate, setStartDate] = useQueryState("start", parseAsString.withDefault(""));
  const [endDate, setEndDate] = useQueryState("end", parseAsString.withDefault(""));

  const employeesQuery = useEmployeesQuery();
  const departmentsQuery = useDepartmentsQuery();

  const apiParams = useMemo(() => ({
    page,
    search: search || undefined,
    status: status === "all" ? undefined : status,
    department: department === "all" ? undefined : department,
    employee: employee === "all" ? undefined : employee,
    start: startDate || undefined,
    end: endDate || undefined,
  }), [page, search, status, department, employee, startDate, endDate]);

  const summaryDate = useMemo(() => 
    startDate || new Date().toISOString().slice(0, 10), 
  [startDate]);

  const resetFilters = () => {
    setPage(1);
    setSearch("");
    setStatus("all");
    setDepartment("all");
    setEmployee("all");
    setStartDate("");
    setEndDate("");
  };

  return {
    page,
    setPage,
    search,
    setSearch,
    status,
    setStatus,
    department,
    setDepartment,
    employee,
    setEmployee,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    apiParams,
    summaryDate,
    resetFilters,
    employees: employeesQuery.data?.results || [],
    departments: departmentsQuery.data || [],
    isFiltersLoading: employeesQuery.isLoading || departmentsQuery.isLoading,
  };
}
