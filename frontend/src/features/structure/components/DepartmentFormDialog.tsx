import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useTranslation } from "react-i18next";

interface DepartmentOption {
  id: string;
  name: string;
}

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit: boolean;
  formData: {
    name: string;
    managerId: string;
    parentId: string;
  };
  onFormChange: (data: { name: string; managerId: string; parentId: string }) => void;
  onSave: (e: React.FormEvent) => void;
  departmentOptions: DepartmentOption[];
  managerOptions: DepartmentOption[];
  isManagerLoading?: boolean;
  formErrors?: Record<string, string>;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  isEdit,
  formData,
  onFormChange,
  onSave,
  departmentOptions,
  managerOptions,
  isManagerLoading = false,
  formErrors = {},
}: DepartmentFormDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("edit_department") : t("add_department")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("department_name")}</Label>
            <Input
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder={t("department_name")}
              required
            />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("department_manager")}</Label>
            <Select
              value={formData.managerId}
              onValueChange={(value) => onFormChange({ ...formData, managerId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_manager")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none")}</SelectItem>
                {isManagerLoading ? (
                  <SelectItem value="loading" disabled>
                    {t("loading")}
                  </SelectItem>
                ) : (
                  managerOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {formErrors.managerId && <p className="text-xs text-destructive">{formErrors.managerId}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("parent_department")}</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) => onFormChange({ ...formData, parentId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("parent_none")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("parent_none")}</SelectItem>
                {departmentOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.parentId && <p className="text-xs text-destructive">{formErrors.parentId}</p>}
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">{isEdit ? t("save") : t("add")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

