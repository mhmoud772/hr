import { useState } from "react";
import { UserCog, Plus, Edit, Trash2, Eye, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { DetailsSheet } from "@/components/shared/DetailsSheet";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  permissions: string[];
  status: "active" | "inactive";
  lastLogin: string;
}

const initialUsers: User[] = [
  { id: "1", name: "أحمد محمد", email: "ahmed@company.com", username: "ahmed.m", role: "مدير النظام", permissions: ["all"], status: "active", lastLogin: "2024-01-15 08:30" },
  { id: "2", name: "سارة علي", email: "sara@company.com", username: "sara.a", role: "مدير موارد بشرية", permissions: ["employees", "leaves", "attendance"], status: "active", lastLogin: "2024-01-15 09:00" },
  { id: "3", name: "محمد خالد", email: "mohammed@company.com", username: "mohammed.k", role: "مشرف", permissions: ["attendance", "reports"], status: "active", lastLogin: "2024-01-14 17:30" },
  { id: "4", name: "فاطمة حسن", email: "fatima@company.com", username: "fatima.h", role: "موظف", permissions: ["self_service"], status: "inactive", lastLogin: "2024-01-10 12:00" },
];

const roles = ["مدير النظام", "مدير موارد بشرية", "مشرف", "موظف"];
const allPermissions = [
  { id: "employees", label: "إدارة الموظفين" },
  { id: "attendance", label: "الحضور والانصراف" },
  { id: "leaves", label: "إدارة الإجازات" },
  { id: "reports", label: "التقارير" },
  { id: "settings", label: "الإعدادات" },
  { id: "users", label: "إدارة المستخدمين" },
  { id: "self_service", label: "الخدمة الذاتية" },
];

export default function Users() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    role: "",
    permissions: [] as string[],
    status: "active" as "active" | "inactive",
  });
  const { toast } = useToast();

  const handleAdd = () => {
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      username: "",
      role: "",
      permissions: [],
      status: "active",
    });
    setFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      status: user.status,
    });
    setFormOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const confirmDelete = () => {
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser?.id));
    toast({
      title: "تم الحذف",
      description: `تم حذف المستخدم "${selectedUser?.name}" بنجاح`,
    });
    setDeleteOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, ...formData } : u))
      );
      toast({ title: "تم التعديل", description: "تم تعديل بيانات المستخدم بنجاح" });
    } else {
      const newUser: User = {
        id: String(Date.now()),
        ...formData,
        lastLogin: "-",
      };
      setUsers((prev) => [...prev, newUser]);
      toast({ title: "تمت الإضافة", description: "تم إضافة المستخدم بنجاح" });
    }
    setFormOpen(false);
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "مدير النظام":
        return <ShieldAlert className="w-4 h-4 text-destructive" />;
      case "مدير موارد بشرية":
        return <ShieldCheck className="w-4 h-4 text-primary" />;
      default:
        return <Shield className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المستخدمين</h1>
          <p className="text-muted-foreground">إدارة مستخدمي النظام والصلاحيات</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة مستخدم
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.status === "active").length}
              </p>
              <p className="text-sm text-muted-foreground">نشط</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.role === "مدير النظام").length}
              </p>
              <p className="text-sm text-muted-foreground">مدراء النظام</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.status === "inactive").length}
              </p>
              <p className="text-sm text-muted-foreground">غير نشط</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            قائمة المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر تسجيل دخول</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{user.username}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      {user.role}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                      {user.status === "active" ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(user)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>اسم المستخدم</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  dir="ltr"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الدور</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الصلاحيات</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                {allPermissions.map((perm) => (
                  <div key={perm.id} className="flex items-center gap-2">
                    <Checkbox
                      id={perm.id}
                      checked={formData.permissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <Label htmlFor={perm.id} className="text-sm font-normal cursor-pointer">
                      {perm.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">{selectedUser ? "حفظ" : "إضافة"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Sheet */}
      <DetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selectedUser?.name || ""}
        subtitle={selectedUser?.email}
        avatar={
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(selectedUser?.name || "")}
            </AvatarFallback>
          </Avatar>
        }
        badge={{
          text: selectedUser?.status === "active" ? "نشط" : "غير نشط",
          variant: selectedUser?.status === "active" ? "default" : "secondary",
        }}
        details={[
          { label: "اسم المستخدم", value: selectedUser?.username || "" },
          { label: "الدور", value: selectedUser?.role || "" },
          { label: "آخر تسجيل دخول", value: selectedUser?.lastLogin || "" },
        ]}
      >
        <div>
          <h4 className="font-medium mb-2">الصلاحيات</h4>
          <div className="flex flex-wrap gap-2">
            {selectedUser?.permissions.map((perm) => {
              const label = allPermissions.find((p) => p.id === perm)?.label || perm;
              return (
                <Badge key={perm} variant="outline">
                  {label}
                </Badge>
              );
            })}
          </div>
        </div>
      </DetailsSheet>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف المستخدم"
        description={`هل أنت متأكد من حذف المستخدم "${selectedUser?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
