import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import {
  useEmployeeMeQuery,
  useUpdateEmployee,
} from "@/features/employees/hooks/useEmployees";
import type { Employee } from "@/types/api";

export interface ProfileFormState {
  email: string;
  phone: string;
  address: string;
  nationality: string;
  birthDate: string;
}

export function useSelfServiceProfile() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const employeeQuery = useEmployeeMeQuery();
  const updateEmployee = useUpdateEmployee();

  const employee = employeeQuery.data;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ProfileFormState>({
    email: "",
    phone: "",
    address: "",
    nationality: "",
    birthDate: "",
  });

  // Sync form when employee data loads
  useEffect(() => {
    if (!employee) return;
    setForm({
      email: employee.email || "",
      phone: employee.phone || "",
      address: employee.address || "",
      nationality: employee.nationality || "",
      birthDate: employee.birthDate || "",
    });
  }, [employee]);

  const updateField = <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!employee) return;
    setIsSaving(true);
    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        data: {
          ...employee,
          email: form.email,
          phone: form.phone,
          address: form.address,
          nationality: form.nationality,
          birthDate: form.birthDate,
        },
      });
      toast({ title: t("self_service_profile_updated") });
      employeeQuery.refetch();
      setIsEditing(false);
    } catch {
      toast({
        title: t("self_service_profile_update_failed"),
        description: t("error_loading"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    employee,
    employeeQuery,
    isEditing,
    setIsEditing,
    isSaving,
    form,
    updateField,
    save,
  };
}
