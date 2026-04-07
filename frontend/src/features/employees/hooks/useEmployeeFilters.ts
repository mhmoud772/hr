import { useState, useMemo } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import { useJobTitlesQuery } from "@/features/job-titles/hooks/useJobTitles";

/**
 * A custom hook to manage the state and logical filters for the employee list.
 */
export function useEmployeeFilters() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
  const [department, setDepartment] = useQueryState("department", parseAsString.withDefault("all"));
  const [jobTitle, setJobTitle] = useQueryState("jobTitle", parseAsString.withDefault("all"));

  const departmentsQuery = useDepartmentsQuery();
  const jobTitlesQuery = useJobTitlesQuery({});

  const departmentOptions = useMemo(
    () => (departmentsQuery.data || []).map((dept) => ({ id: String(dept.id), name: dept.name })),
    [departmentsQuery.data],
  );

  const jobTitleOptions = useMemo(
    () => (jobTitlesQuery.data?.results || []).map((job) => ({ id: String(job.id), name: job.name })),
    [jobTitlesQuery.data],
  );

  const apiParams = useMemo(() => ({
    page,
    search: search || undefined,
    status: status === "all" ? undefined : status,
    department: department === "all" ? undefined : department,
    job_title: jobTitle === "all" ? undefined : jobTitle,
  }), [page, search, status, department, jobTitle]);

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setDepartment("all");
    setJobTitle("all");
    setPage(1);
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
    jobTitle,
    setJobTitle,
    apiParams,
    departmentOptions,
    jobTitleOptions,
    isFiltersLoading: departmentsQuery.isLoading || jobTitlesQuery.isLoading,
    resetFilters,
  };
}
