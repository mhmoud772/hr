import { useState } from "react";
import { Fingerprint, Plus, Edit, Trash2, RefreshCw, Wifi, WifiOff, Eye, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { DetailsSheet } from "@/components/shared/DetailsSheet";
import { useToast } from "@/hooks/use-toast";

interface Device {
  id: string;
  name: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  status: "online" | "offline";
  lastSync: string;
  employeeCount: number;
}

const initialDevices: Device[] = [
  { id: "1", name: "جهاز البصمة - المدخل الرئيسي", serialNumber: "ZK-2024-001", ipAddress: "192.168.1.100", location: "المدخل الرئيسي", status: "online", lastSync: "2024-01-15 08:30", employeeCount: 120 },
  { id: "2", name: "جهاز البصمة - قسم التقنية", serialNumber: "ZK-2024-002", ipAddress: "192.168.1.101", location: "الطابق الثاني", status: "online", lastSync: "2024-01-15 08:25", employeeCount: 25 },
  { id: "3", name: "جهاز البصمة - قسم المبيعات", serialNumber: "ZK-2024-003", ipAddress: "192.168.1.102", location: "الطابق الأول", status: "offline", lastSync: "2024-01-14 17:00", employeeCount: 30 },
  { id: "4", name: "جهاز البصمة - المستودع", serialNumber: "ZK-2024-004", ipAddress: "192.168.1.103", location: "المستودع", status: "online", lastSync: "2024-01-15 08:28", employeeCount: 15 },
];

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    ipAddress: "",
    location: "",
  });
  const { toast } = useToast();

  const handleAdd = () => {
    setSelectedDevice(null);
    setFormData({ name: "", serialNumber: "", ipAddress: "", location: "" });
    setFormOpen(true);
  };

  const handleEdit = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      name: device.name,
      serialNumber: device.serialNumber,
      ipAddress: device.ipAddress,
      location: device.location,
    });
    setFormOpen(true);
  };

  const handleDelete = (device: Device) => {
    setSelectedDevice(device);
    setDeleteOpen(true);
  };

  const handleView = (device: Device) => {
    setSelectedDevice(device);
    setDetailsOpen(true);
  };

  const confirmDelete = () => {
    setDevices((prev) => prev.filter((d) => d.id !== selectedDevice?.id));
    toast({
      title: "تم الحذف",
      description: `تم حذف الجهاز "${selectedDevice?.name}" بنجاح`,
    });
    setDeleteOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDevice) {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === selectedDevice.id ? { ...d, ...formData } : d
        )
      );
      toast({ title: "تم التعديل", description: "تم تعديل بيانات الجهاز بنجاح" });
    } else {
      const newDevice: Device = {
        id: String(Date.now()),
        ...formData,
        status: "offline",
        lastSync: "-",
        employeeCount: 0,
      };
      setDevices((prev) => [...prev, newDevice]);
      toast({ title: "تمت الإضافة", description: "تم إضافة الجهاز بنجاح" });
    }
    setFormOpen(false);
  };

  const handleSync = (device: Device) => {
    toast({
      title: "جاري المزامنة",
      description: `جاري مزامنة "${device.name}"...`,
    });
  };

  const onlineCount = devices.filter((d) => d.status === "online").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">أجهزة البصمة</h1>
          <p className="text-muted-foreground">إدارة ومراقبة أجهزة تسجيل الحضور</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة جهاز
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{devices.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي الأجهزة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{onlineCount}</p>
              <p className="text-sm text-muted-foreground">متصل</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{devices.length - onlineCount}</p>
              <p className="text-sm text-muted-foreground">غير متصل</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-primary" />
            قائمة الأجهزة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الجهاز</TableHead>
                <TableHead>الرقم التسلسلي</TableHead>
                <TableHead>عنوان IP</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر مزامنة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell className="font-mono text-sm">{device.serialNumber}</TableCell>
                  <TableCell className="font-mono text-sm">{device.ipAddress}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>
                    <Badge variant={device.status === "online" ? "default" : "destructive"}>
                      {device.status === "online" ? (
                        <><Wifi className="w-3 h-3 ml-1" /> متصل</>
                      ) : (
                        <><WifiOff className="w-3 h-3 ml-1" /> غير متصل</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{device.lastSync}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(device)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleSync(device)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(device)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(device)}>
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
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {selectedDevice ? "تعديل الجهاز" : "إضافة جهاز جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الجهاز</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الرقم التسلسلي</Label>
                <Input
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>عنوان IP</Label>
                <Input
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  placeholder="192.168.1.100"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الموقع</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">{selectedDevice ? "حفظ" : "إضافة"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Sheet */}
      <DetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selectedDevice?.name || ""}
        subtitle={selectedDevice?.serialNumber}
        avatar={
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Fingerprint className="w-6 h-6 text-primary" />
          </div>
        }
        badge={{
          text: selectedDevice?.status === "online" ? "متصل" : "غير متصل",
          variant: selectedDevice?.status === "online" ? "default" : "destructive",
        }}
        details={[
          { label: "عنوان IP", value: selectedDevice?.ipAddress || "" },
          { label: "الموقع", value: selectedDevice?.location || "" },
          { label: "آخر مزامنة", value: selectedDevice?.lastSync || "" },
          { label: "عدد الموظفين المسجلين", value: selectedDevice?.employeeCount || 0 },
        ]}
      >
        <div className="flex gap-2">
          <Button className="flex-1" variant="outline">
            <Settings className="w-4 h-4 ml-2" />
            إعدادات الجهاز
          </Button>
          <Button className="flex-1">
            <RefreshCw className="w-4 h-4 ml-2" />
            مزامنة الآن
          </Button>
        </div>
      </DetailsSheet>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف الجهاز"
        description={`هل أنت متأكد من حذف "${selectedDevice?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
