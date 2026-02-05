
import { useMemo, useState } from "react";
import {
  UserCog,
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Checkbox } from "@/shared/ui/checkbox";
import { Switch } from "@/shared/ui/switch";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { useToast } from "@/shared/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { useCreateUser, useDeleteUser, useUpdateUser, useUsersQuery } from "@/features/users/hooks/useUsers";
import type { User } from "@/types/api";

const roles = ["system_admin", "hr_manager", "supervisor", "employee", "admin"] as const;
const allPermissions = [
  { id: "employees", key: "perm_employees" },
  { id: "attendance", key: "perm_attendance" },
  { id: "leaves", key: "perm_leaves" },
  { id: "reports", key: "perm_reports" },
  { id: "structure", key: "perm_structure" },
  { id: "devices", key: "perm_devices" },
  { id: "payroll", key: "perm_payroll" },
  { id: "recruitment", key: "perm_recruitment" },
  { id: "performance", key: "perm_performance" },
  { id: "training", key: "perm_training" },
  { id: "assets", key: "perm_assets" },
  { id: "settings", key: "perm_settings" },
  { id: "users", key: "perm_users" },
  { id: "self_service", key: "perm_self_service" },
];

const rolePermissions: Record<string, string[]> = {
  system_admin: allPermissions.map((p) => p.id),
  admin: allPermissions.map((p) => p.id),
  hr_manager: ["employees", "attendance", "leaves", "reports", "structure", "devices", "payroll", "recruitment", "performance", "training", "assets", "settings", "users"],
  supervisor: ["attendance", "leaves", "self_service", "reports"],
  employee: ["self_service"],
};

export default function Users() {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const isRtl = i18n.language === "ar";
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
    useRolePermissions: true,
    status: "active" as "active" | "inactive",
    password: "",
    mustChangePassword: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const query = useUsersQuery({
    page,
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    is_active: statusFilter === "all" ? undefined : statusFilter,
  });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const users = query.data?.results ?? [];
  const totalCount = query.data?.count ?? users.length;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const canAdmin = ["system_admin", "admin", "hr_manager"].includes(String(currentUser?.role || ""));

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "system_admin":
        return <ShieldAlert className="w-4 h-4 text-destructive" />;
      case "hr_manager":
        return <ShieldCheck className="w-4 h-4 text-primary" />;
      default:
        return <Shield className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const roleBasedPermissions = useMemo(() => {
    const role = formData.role || "employee";
    return rolePermissions[role] || rolePermissions.employee;
  }, [formData.role]);

  const effectivePermissions = formData.useRolePermissions ? roleBasedPermissions : formData.permissions;

  const handleAdd = () => {
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      username: "",
      role: "",
      permissions: [],
      useRolePermissions: true,
      status: "active",
      password: "",
      mustChangePassword: true,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      username: user.username || "",
      role: user.role || "employee",
      permissions: user.permissions || [],
      useRolePermissions: !(user.permissions && user.permissions.length > 0),
      status: user.is_active ? "active" : "inactive",
      password: "",
      mustChangePassword: Boolean(user.must_change_password),
    });
    setFormErrors({});
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

  const confirmDelete = async () => {
    if (!selectedUser?.id) return;
    if (String(selectedUser.id) === String(currentUser?.id)) {
      toast({ title: t("generic_error"), description: t("cannot_delete_self") });
      setDeleteOpen(false);
      return;
    }
    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toast({ title: t("user_deleted"), description: t("user_deleted_desc", { name: selectedUser?.name || "" }) });
    } catch (err) {
      toast({ title: t("generic_error"), description: String(err) });
    }
    setDeleteOpen(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t("name_required");
    if (!formData.username.trim()) errors.username = t("username_required");
    if (!formData.role) errors.role = t("select_role");
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("invalid_email");
    }
    const dupUsername = users.find(
      (u) => u.username === formData.username && String(u.id) !== String(selectedUser?.id),
    );
    if (dupUsername) errors.username = t("username_taken");
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      username: formData.username,
      email: formData.email,
      role: formData.role,
      is_active: formData.status === "active",
      first_name: formData.name.split(" ").slice(0, 1).join(" "),
      last_name: formData.name.split(" ").slice(1).join(" "),
      must_change_password: formData.mustChangePassword,
      password: formData.password || undefined,
      permissions: formData.useRolePermissions ? [] : formData.permissions,
    };

    try {
      if (selectedUser?.id) {
        if (String(selectedUser.id) === String(currentUser?.id) && formData.role !== currentUser?.role) {
          toast({ title: t("generic_error"), description: t("cannot_change_own_role") });
          return;
        }
        await updateUser.mutateAsync({ id: selectedUser.id, data: payload });
        toast({ title: t("user_updated"), description: t("user_updated_desc") });
      } else {
        if (!formData.password) {
          setFormErrors({ password: t("password_min") });
          return;
        }
        await createUser.mutateAsync(payload);
        toast({ title: t("user_added"), description: t("user_added_desc") });
      }
      setFormOpen(false);
    } catch (err) {
      toast({ title: t("generic_error"), description: String(err) });
    }
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const grantAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      useRolePermissions: false,
      permissions: allPermissions.map((p) => p.id),
    }));
  };

  const clearAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      useRolePermissions: false,
      permissions: [],
    }));
  };

  if (query.isLoading) return <LoadingState label={t("loading")} />;
  if (query.isError) {
    return (
      <div className="p-6">
        <EmptyState title={t("error_loading")} icon={ShieldAlert} actionLabel={t("retry")} onAction={() => query.refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("users_title")}</h1>
          <p className="text-muted-foreground">{t("users_subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className={`w-4 h-4 absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-muted-foreground`} />
            <Input
              className={`${isRtl ? "pr-9" : "pl-9"} w-56`}
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("role")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status_all")}</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {t(`role_${role}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status_all")}</SelectItem>
              <SelectItem value="true">{t("status_active")}</SelectItem>
              <SelectItem value="false">{t("status_inactive")}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!canAdmin}>
            <Plus className="w-4 h-4 ml-2" />
            {t("add_user")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-sm text-muted-foreground">{t("total_users")}</p>
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
                {users.filter((u) => u.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">{t("status_active")}</p>
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
                {users.filter((u) => u.role === "system_admin").length}
              </p>
              <p className="text-sm text-muted-foreground">{t("system_admins")}</p>
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
                {users.filter((u) => u.is_active === false).length}
              </p>
              <p className="text-sm text-muted-foreground">{t("status_inactive")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            {t("users_list")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState title={t("no_data")} icon={UserCog} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("user")}</TableHead>
                  <TableHead>{t("username")}</TableHead>
                  <TableHead>{t("role")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("last_login")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.name || user.username || "-")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name || user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email || "-"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{user.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        {t(`role_${user.role}`)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? t("status_active") : t("status_inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.last_login || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(user)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} disabled={!canAdmin}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user)}
                          disabled={!canAdmin || String(user.id) === String(currentUser?.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {t("previous")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                {t("next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedUser ? t("edit") : t("add_user")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">{t("general_settings")}</TabsTrigger>
                <TabsTrigger value="access">{t("permissions")}</TabsTrigger>
                <TabsTrigger value="security">{t("change_password")}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("full_name_label")}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("username")}</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      dir="ltr"
                      required
                    />
                    {formErrors.username && <p className="text-xs text-destructive">{formErrors.username}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("email")}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    dir="ltr"
                    required
                  />
                  {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("role")}</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                      disabled={String(selectedUser?.id) === String(currentUser?.id)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_role")} />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(`role_${role}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.role && <p className="text-xs text-destructive">{formErrors.role}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("status")}</Label>
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
                        <SelectItem value="active">{t("status_active")}</SelectItem>
                        <SelectItem value="inactive">{t("status_inactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="access" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label>{t("permissions")}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={grantAllPermissions}
                    >
                      {t("permissions_select_all")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={clearAllPermissions}
                    >
                      {t("permissions_clear_all")}
                    </Button>
                    <Switch
                      checked={formData.useRolePermissions}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          useRolePermissions: checked,
                          permissions: checked ? [] : roleBasedPermissions,
                        }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">{t("use_role_permissions")}</span>
                  </div>
                </div>
                <details className="rounded-lg border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    {t("permissions")}
                  </summary>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    {allPermissions.map((perm) => (
                      <div key={perm.id} className="flex items-center gap-2">
                        <Checkbox
                          id={perm.id}
                          checked={effectivePermissions.includes(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                          disabled={formData.useRolePermissions}
                        />
                        <Label htmlFor={perm.id} className="text-sm font-normal cursor-pointer">
                          {t(perm.key)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </details>
                <p className="text-xs text-muted-foreground">{t("role_permissions_hint")}</p>
                <div className="flex flex-wrap gap-2">
                  {effectivePermissions.map((perm) => (
                    <Badge key={perm} variant="outline">
                      {t(allPermissions.find((p) => p.id === perm)?.key || perm)}
                    </Badge>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("password")}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      dir="ltr"
                    />
                    {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("force_password_change")}</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.mustChangePassword}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, mustChangePassword: checked })
                        }
                      />
                      <span className="text-sm text-muted-foreground">{t("force_password_change_desc")}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit">{selectedUser ? t("save") : t("add")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selectedUser?.name || ""}
        subtitle={selectedUser?.email}
        avatar={
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(selectedUser?.name || selectedUser?.username || "")}
            </AvatarFallback>
          </Avatar>
        }
        badge={{
          text: selectedUser?.is_active ? t("status_active") : t("status_inactive"),
          variant: selectedUser?.is_active ? "default" : "secondary",
        }}
        details={[
          { label: t("username"), value: selectedUser?.username || "" },
          { label: t("role"), value: selectedUser ? t(`role_${selectedUser.role}`) : "" },
          { label: t("last_login"), value: selectedUser?.last_login || "-" },
        ]}
      >
        <div>
          <h4 className="font-medium mb-2">{t("permissions")}</h4>
          {(selectedUser?.permissions?.length
            ? selectedUser.permissions
            : rolePermissions[selectedUser?.role || "employee"])?.length ? (
            <div className="flex flex-wrap gap-2">
              {(selectedUser?.permissions?.length
                ? selectedUser.permissions
                : rolePermissions[selectedUser?.role || "employee"]).map((perm) => {
                const label = allPermissions.find((p) => p.id === perm)?.key || perm;
                return (
                  <Badge key={perm} variant="outline">
                    {t(label)}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("status_inactive")}</p>
          )}
        </div>
      </DetailsSheet>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_user_title")}
        description={t("delete_user_desc", { name: selectedUser?.name || "" })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
