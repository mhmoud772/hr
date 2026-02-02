import { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Users
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmployeeFormDialog } from "@/components/employees/EmployeeFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { DetailsSheet } from "@/components/shared/DetailsSheet";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  hireDate: string;
  status: "active" | "leave" | "inactive";
}

const initialEmployees: Employee[] = [
  { id: "EMP001", name: "أحمد محمد علي", email: "ahmed@company.com", phone: "0501234567", department: "الإدارة", jobTitle: "مدير قسم", hireDate: "2022-01-15", status: "active" },
  { id: "EMP002", name: "سارة أحمد حسن", email: "sara@company.com", phone: "0502345678", department: "الموارد البشرية", jobTitle: "أخصائي موارد بشرية", hireDate: "2021-06-20", status: "active" },
  { id: "EMP003", name: "محمد خالد عمر", email: "mohammed@company.com", phone: "0503456789", department: "التقنية", jobTitle: "مطور برمجيات", hireDate: "2023-03-01", status: "active" },
  { id: "EMP004", name: "فاطمة علي محمود", email: "fatima@company.com", phone: "0504567890", department: "المبيعات", jobTitle: "مندوب مبيعات", hireDate: "2022-09-10", status: "leave" },
  { id: "EMP005", name: "عبدالله سعيد", email: "abdullah@company.com", phone: "0505678901", department: "المحاسبة", jobTitle: "محاسب", hireDate: "2020-11-25", status: "active" },
];

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  const filteredEmployees = employees.filter(emp => 
    emp.name.includes(searchQuery) || 
    emp.id.includes(searchQuery) ||
    emp.department.includes(searchQuery)
  );

  const handleAdd = () => {
    setSelectedEmployee(null);
    setFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteOpen(true);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailsOpen(true);
  };

  const confirmDelete = () => {
    setEmployees(prev => prev.filter(e => e.id !== selectedEmployee?.id));
    toast({
      title: "تم الحذف",
      description: `تم حذف الموظف "${selectedEmployee?.name}" بنجاح`,
    });
    setDeleteOpen(false);
  };

  const handleSave = (data: Partial<Employee>) => {
    if (selectedEmployee) {
      setEmployees(prev => 
        prev.map(e => e.id === selectedEmployee.id ? { ...e, ...data } as Employee : e)
      );
      toast({ title: "تم التعديل", description: "تم تعديل بيانات الموظف بنجاح" });
    } else {
      const newEmployee: Employee = {
        id: `EMP${String(employees.length + 1).padStart(3, "0")}`,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        department: data.department || "",
        jobTitle: data.jobTitle || "",
        hireDate: data.hireDate || "",
        status: data.status || "active",
      };
      setEmployees(prev => [...prev, newEmployee]);
      toast({ title: "تمت الإضافة", description: "تم إضافة الموظف بنجاح" });
    }
  };

  const getStatusBadge = (status: Employee["status"]) => {
    const config = {
      active: { label: "نشط", className: "bg-emerald-500/10 text-emerald-600" },
      leave: { label: "إجازة", className: "bg-amber-500/10 text-amber-600" },
      inactive: { label: "غير نشط", className: "bg-muted text-muted-foreground" },
    };
    return config[status];
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الموظفين</h1>
          <p className="text-muted-foreground">عرض وإدارة بيانات جميع الموظفين</p>
        </div>
        <Button className="gap-2" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          إضافة موظف
        </Button>
      </div>

      {/* Filters & Search */}
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
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                فلترة
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">قائمة الموظفين ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الموظف</TableHead>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">القسم</TableHead>
                <TableHead className="text-right">المسمى الوظيفي</TableHead>
                <TableHead className="text-right">تاريخ التعيين</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => {
                const statusConfig = getStatusBadge(employee.status);
                return (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        {employee.name}
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.jobTitle}</TableCell>
                    <TableCell>{employee.hireDate}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusConfig.className}>
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
                          <DropdownMenuItem className="gap-2" onClick={() => handleView(employee)}>
                            <Eye className="w-4 h-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleEdit(employee)}>
                            <Edit className="w-4 h-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(employee)}>
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
      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={selectedEmployee}
        onSave={handleSave}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف الموظف"
        description={`هل أنت متأكد من حذف الموظف "${selectedEmployee?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={confirmDelete}
      />

      {/* Details Sheet */}
      <DetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selectedEmployee?.name || ""}
        subtitle={selectedEmployee?.jobTitle}
        avatar={
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(selectedEmployee?.name || "")}
            </AvatarFallback>
          </Avatar>
        }
        badge={{
          text: getStatusBadge(selectedEmployee?.status || "active").label,
          variant: selectedEmployee?.status === "active" ? "default" : "secondary",
        }}
        details={[
          { label: "رقم الموظف", value: selectedEmployee?.id || "" },
          { label: "البريد الإلكتروني", value: selectedEmployee?.email || "" },
          { label: "رقم الهاتف", value: selectedEmployee?.phone || "" },
          { label: "القسم", value: selectedEmployee?.department || "" },
          { label: "تاريخ التعيين", value: selectedEmployee?.hireDate || "" },
        ]}
      />
    </div>
  );
}
