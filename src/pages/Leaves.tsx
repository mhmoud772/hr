import { useState } from "react";
import { 
  Plus, 
  Calendar, 
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  FileText,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LeaveRequestDialog } from "@/components/leaves/LeaveRequestDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { DetailsSheet } from "@/components/shared/DetailsSheet";
import { useToast } from "@/hooks/use-toast";
import { generateLeavesReport, downloadPDF } from "@/lib/pdf-reports";
import { notifyLeaveRequest, notifyLeaveApproved, notifyLeaveRejected, notifyReportGenerated } from "@/lib/notifications";

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

const initialRequests: LeaveRequest[] = [
  { id: "LR001", employeeId: "EMP001", employeeName: "أحمد محمد علي", leaveType: "سنوية", startDate: "2024-01-20", endDate: "2024-01-25", days: 5, reason: "إجازة عائلية", status: "approved" },
  { id: "LR002", employeeId: "EMP002", employeeName: "سارة أحمد حسن", leaveType: "مرضية", startDate: "2024-01-18", endDate: "2024-01-19", days: 2, reason: "مرض", status: "pending" },
  { id: "LR003", employeeId: "EMP003", employeeName: "محمد خالد عمر", leaveType: "طارئة", startDate: "2024-01-22", endDate: "2024-01-22", days: 1, reason: "ظروف شخصية", status: "rejected" },
  { id: "LR004", employeeId: "EMP004", employeeName: "فاطمة علي محمود", leaveType: "سنوية", startDate: "2024-02-01", endDate: "2024-02-07", days: 7, reason: "سفر", status: "pending" },
];

const leaveTypes = [
  { name: "سنوية", total: 21, used: 5, remaining: 16, color: "primary" },
  { name: "مرضية", total: 14, used: 2, remaining: 12, color: "success" },
  { name: "طارئة", total: 5, used: 1, remaining: 4, color: "warning" },
];

export default function Leaves() {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const { toast } = useToast();

  const filteredRequests = requests.filter(req => 
    req.employeeName.includes(searchQuery) || 
    req.employeeId.includes(searchQuery)
  );

  const handleAdd = () => {
    setSelectedRequest(null);
    setFormOpen(true);
  };

  const handleEdit = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setFormOpen(true);
  };

  const handleDelete = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setDeleteOpen(true);
  };

  const handleView = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const handleApprove = (request: LeaveRequest) => {
    setRequests(prev => 
      prev.map(r => r.id === request.id ? { ...r, status: "approved" as const } : r)
    );
    notifyLeaveApproved(request.employeeName);
  };

  const handleReject = (request: LeaveRequest) => {
    setRequests(prev => 
      prev.map(r => r.id === request.id ? { ...r, status: "rejected" as const } : r)
    );
    notifyLeaveRejected(request.employeeName);
  };

  const confirmDelete = () => {
    setRequests(prev => prev.filter(r => r.id !== selectedRequest?.id));
    toast({
      title: "تم الحذف",
      description: `تم حذف طلب الإجازة بنجاح`,
    });
    setDeleteOpen(false);
  };

  const handleSave = (data: Partial<LeaveRequest>) => {
    if (selectedRequest) {
      setRequests(prev => 
        prev.map(r => r.id === selectedRequest.id ? { ...r, ...data } as LeaveRequest : r)
      );
      toast({ title: "تم التعديل", description: "تم تعديل طلب الإجازة بنجاح" });
    } else {
      const employeeName = "الموظف الحالي";
      const newRequest: LeaveRequest = {
        id: `LR${String(requests.length + 1).padStart(3, "0")}`,
        employeeId: "EMP001",
        employeeName,
        leaveType: data.leaveType || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        days: data.days || 1,
        reason: data.reason || "",
        status: "pending",
      };
      setRequests(prev => [...prev, newRequest]);
      notifyLeaveRequest(employeeName, data.leaveType || "");
    }
  };

  const handleExportPDF = () => {
    const doc = generateLeavesReport(requests);
    downloadPDF(doc, "leaves-report");
    notifyReportGenerated("تقرير الإجازات");
  };

  const getStatusConfig = (status: LeaveRequest["status"]) => {
    const config = {
      approved: { label: "معتمدة", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600" },
      rejected: { label: "مرفوضة", icon: XCircle, className: "bg-destructive/10 text-destructive" },
      pending: { label: "قيد المراجعة", icon: Hourglass, className: "bg-amber-500/10 text-amber-600" },
    };
    return config[status];
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الإجازات</h1>
          <p className="text-muted-foreground">طلبات الإجازات وأرصدة الموظفين</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <FileText className="w-4 h-4" />
            تصدير PDF
          </Button>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            طلب إجازة جديد
          </Button>
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaveTypes.map((type, index) => (
          <Card key={index} className="bg-card border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">{type.name}</span>
                <Calendar className={`w-5 h-5 ${
                  type.color === 'primary' ? 'text-primary' :
                  type.color === 'success' ? 'text-emerald-600' :
                  'text-amber-600'
                }`} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الرصيد الكلي</span>
                  <span className="font-medium">{type.total} يوم</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المستخدم</span>
                  <span className="font-medium">{type.used} يوم</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المتبقي</span>
                  <span className={`font-bold ${
                    type.color === 'primary' ? 'text-primary' :
                    type.color === 'success' ? 'text-emerald-600' :
                    'text-amber-600'
                  }`}>{type.remaining} يوم</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      type.color === 'primary' ? 'bg-primary' :
                      type.color === 'success' ? 'bg-emerald-500' :
                      'bg-amber-500'
                    }`}
                    style={{ width: `${(type.used / type.total) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="بحث بالاسم أو رقم الموظف..." 
                className="pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              فلترة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            طلبات الإجازات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">نوع الإجازة</TableHead>
                <TableHead className="text-right">من تاريخ</TableHead>
                <TableHead className="text-right">إلى تاريخ</TableHead>
                <TableHead className="text-right">عدد الأيام</TableHead>
                <TableHead className="text-right">السبب</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => {
                const statusConfig = getStatusConfig(request.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(request.employeeName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{request.employeeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.leaveType}</Badge>
                    </TableCell>
                    <TableCell>{request.startDate}</TableCell>
                    <TableCell>{request.endDate}</TableCell>
                    <TableCell className="font-medium">{request.days} يوم</TableCell>
                    <TableCell className="text-muted-foreground max-w-[150px] truncate">{request.reason}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusConfig.className}>
                        <StatusIcon className="w-3 h-3 ml-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleView(request)}>
                            <Eye className="w-4 h-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {request.status === "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-emerald-600" onClick={() => handleApprove(request)}>
                                <Check className="w-4 h-4" />
                                اعتماد
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleReject(request)}>
                                <X className="w-4 h-4" />
                                رفض
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2" onClick={() => handleEdit(request)}>
                                <Edit className="w-4 h-4" />
                                تعديل
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(request)}>
                            <Trash2 className="w-4 h-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <LeaveRequestDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        request={selectedRequest}
        onSave={handleSave}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف طلب الإجازة"
        description="هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
      />

      {/* Details Sheet */}
      <DetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selectedRequest?.employeeName || ""}
        subtitle={`طلب إجازة ${selectedRequest?.leaveType}`}
        avatar={
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(selectedRequest?.employeeName || "")}
            </AvatarFallback>
          </Avatar>
        }
        badge={{
          text: getStatusConfig(selectedRequest?.status || "pending").label,
          variant: selectedRequest?.status === "approved" ? "default" : selectedRequest?.status === "rejected" ? "destructive" : "secondary",
        }}
        details={[
          { label: "رقم الموظف", value: selectedRequest?.employeeId || "" },
          { label: "نوع الإجازة", value: selectedRequest?.leaveType || "" },
          { label: "من تاريخ", value: selectedRequest?.startDate || "" },
          { label: "إلى تاريخ", value: selectedRequest?.endDate || "" },
          { label: "عدد الأيام", value: `${selectedRequest?.days || 0} يوم` },
        ]}
      >
        <div>
          <h4 className="font-medium mb-2">السبب</h4>
          <p className="text-muted-foreground text-sm">{selectedRequest?.reason}</p>
        </div>
      </DetailsSheet>
    </div>
  );
}
