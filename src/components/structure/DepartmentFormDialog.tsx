import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    manager: string;
    parentId: string;
  };
  onFormChange: (data: { name: string; manager: string; parentId: string }) => void;
  onSave: (e: React.FormEvent) => void;
  departmentOptions: DepartmentOption[];
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  isEdit,
  formData,
  onFormChange,
  onSave,
  departmentOptions,
}: DepartmentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "تعديل القسم" : "إضافة قسم جديد"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-2">
            <Label>اسم القسم</Label>
            <Input
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="أدخل اسم القسم"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>مدير القسم</Label>
            <Input
              value={formData.manager}
              onChange={(e) => onFormChange({ ...formData, manager: e.target.value })}
              placeholder="أدخل اسم مدير القسم"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>القسم الأب</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) => onFormChange({ ...formData, parentId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="بدون (قسم رئيسي)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون (قسم رئيسي)</SelectItem>
                {departmentOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">{isEdit ? "حفظ" : "إضافة"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
