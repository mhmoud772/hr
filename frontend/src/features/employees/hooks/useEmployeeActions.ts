import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import {
  useCreateEmployee,
  useCreateEmployeeWithFile,
  useUpdateEmployee,
  useUpdateEmployeeWithFile,
  useDeleteEmployee,
  useExportEmployeesCSV,
  useImportEmployeesCSV,
} from "@/features/employees/hooks/useEmployees";
import type { Employee } from "@/types/api";
import { buildEmployeePayload } from "../lib/employee-payload";
import type { ApiEmployeeRequest, ApiPatchedEmployeeRequest } from "@/types/contracts";

type ImportEmployeesResponse = {
  created?: number;
  updated?: number;
};

/**
 * A hook to centralize employee-related actions (create, update, delete, import, export).
 */
export function useEmployeeActions(refetch?: () => void) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const createMutation = useCreateEmployee();
  const createWithFileMutation = useCreateEmployeeWithFile();
  const updateMutation = useUpdateEmployee();
  const updateWithFileMutation = useUpdateEmployeeWithFile();
  const deleteMutation = useDeleteEmployee();
  const exportMutation = useExportEmployeesCSV();
  const importMutation = useImportEmployeesCSV();

  const handleSave = async (
    selectedEmployee: Employee | null,
    data: Partial<Employee>,
    avatarFile?: File | null
  ) => {
    try {
      const payload = buildEmployeePayload(data);

      if (selectedEmployee) {
        setActionLoading(selectedEmployee.id);
        if (avatarFile) {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, String(value));
            }
          });
          formData.append("avatar", avatarFile);
          await updateWithFileMutation.mutateAsync({ id: selectedEmployee.id, data: formData });
        } else {
          await updateMutation.mutateAsync({ id: selectedEmployee.id, data: payload as ApiPatchedEmployeeRequest });
        }
        toast({ title: t("employee_updated"), description: t("employee_updated_desc") });
      } else {
        if (avatarFile) {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, String(value));
            }
          });
          formData.append("avatar", avatarFile);
          await createWithFileMutation.mutateAsync(formData);
        } else {
          await createMutation.mutateAsync(payload as ApiEmployeeRequest);
        }
        toast({ title: t("employee_added"), description: t("employee_added_desc") });
      }
      if (refetch) refetch();
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async (selectedEmployee: Employee | null) => {
    const deleteTarget = selectedEmployee?.id;
    if (!deleteTarget) return;
    setActionLoading(deleteTarget);
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast({
        title: t("employee_deleted"),
        description: t("employee_deleted_desc", { name: selectedEmployee?.name || "" }),
      });
      if (refetch) refetch();
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await exportMutation.mutateAsync(undefined);
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `employees_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleImportCSV = async (file: File) => {
    try {
      const result = await importMutation.mutateAsync(file);
      const summary = result as ImportEmployeesResponse;
      toast({ 
        title: t("import_employees_success"), 
        description: t("import_employees_success_desc", {
          created: summary.created ?? 0,
          updated: summary.updated ?? 0,
        })
      });
      if (refetch) refetch();
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  return {
    handleSave,
    confirmDelete,
    handleExportCSV,
    handleImportCSV,
    isSaving: createMutation.isPending || createWithFileMutation.isPending || updateMutation.isPending || updateWithFileMutation.isPending,
    isDeleting: deleteMutation.isPending,
    actionLoading,
  };
}
