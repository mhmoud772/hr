import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: LeaveRequest | null;
  onSave: (request: Partial<LeaveRequest>) => void;
}

const leaveTypes = ["سنوية", "مرضية", "طارئة", "بدون راتب"];

export function LeaveRequestDialog({
  open,
  onOpenChange,
  request,
  onSave,
}: LeaveRequestDialogProps) {
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    if (request) {
      setFormData({
        leaveType: request.leaveType,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason,
      });
    } else {
      setFormData({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });
    }
  }, [request, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = Math.ceil(
      (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;
    onSave({ ...formData, days });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {request ? "تعديل طلب الإجازة" : "طلب إجازة جديد"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>نوع الإجازة</Label>
            <Select
              value={formData.leaveType}
              onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الإجازة" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">من تاريخ</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">إلى تاريخ</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">السبب</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="اذكر سبب الإجازة..."
              rows={3}
            />
          </div>
          
          <DialogFooter className="flex-row-reverse gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">
              {request ? "حفظ التعديلات" : "إرسال الطلب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
