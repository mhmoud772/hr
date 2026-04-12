import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { Employee } from "@/types/api";
import { useTranslation } from "react-i18next";
import { EmployeeForm } from "./EmployeeForm";

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSave: (employee: Partial<Employee>, avatarFile?: File | null) => void;
  isLoading?: boolean;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSave,
  isLoading,
}: EmployeeFormDialogProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith("ar");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">
            {employee ? t("employee_form_edit_title") : t("employee_form_add_title")}
          </DialogTitle>
        </DialogHeader>

        <EmployeeForm
          employee={employee}
          onSave={(data, file) => {
            onSave(data, file);
            // The actual dialog closing is handled by the parent or by onSave finishing
            // But usually we close it here if onSave is async and we don't wait?
            // Actually, the parent (Employees.tsx) usually handles the result.
            // But the previous implementation had onOpenChange(false) inside handleSubmit.
          }}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}



