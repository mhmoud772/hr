import { useState } from "react";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateAttendanceReport, downloadPDF } from "@/lib/pdf-reports";
import { notifyReportGenerated, notifyLateArrival } from "@/lib/notifications";

const attendanceRecords = [
  { 
    id: 1, 
    employeeId: "EMP001",
    name: "أحمد محمد علي", 
    date: "2024-01-15",
    checkIn: "08:00",
    checkOut: "17:00",
    status: "حاضر",
    workHours: "9:00"
  },
  { 
    id: 2, 
    employeeId: "EMP002",
    name: "سارة أحمد حسن", 
    date: "2024-01-15",
    checkIn: "08:30",
    checkOut: "17:30",
    status: "متأخر",
    workHours: "9:00"
  },
  { 
    id: 3, 
    employeeId: "EMP003",
    name: "محمد خالد عمر", 
    date: "2024-01-15",
    checkIn: "07:45",
    checkOut: "16:45",
    status: "حاضر",
    workHours: "9:00"
  },
  { 
    id: 4, 
    employeeId: "EMP004",
    name: "فاطمة علي محمود", 
    date: "2024-01-15",
    checkIn: "-",
    checkOut: "-",
    status: "غائب",
    workHours: "-"
  },
  { 
    id: 5, 
    employeeId: "EMP005",
    name: "عبدالله سعيد", 
    date: "2024-01-15",
    checkIn: "08:05",
    checkOut: "17:10",
    status: "حاضر",
    workHours: "9:05"
  },
];

const summaryStats = [
  { label: "إجمالي الموظفين", value: 50, icon: Clock, color: "primary" },
  { label: "الحاضرون", value: 42, icon: CheckCircle, color: "success" },
  { label: "الغائبون", value: 5, icon: XCircle, color: "destructive" },
  { label: "المتأخرون", value: 3, icon: AlertCircle, color: "warning" },
];

export default function Attendance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.name.includes(searchQuery) || 
                         record.employeeId.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "حاضر":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
            <CheckCircle className="w-3 h-3 ml-1" />
            {status}
          </Badge>
        );
      case "غائب":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
            <XCircle className="w-3 h-3 ml-1" />
            {status}
          </Badge>
        );
      case "متأخر":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
            <AlertCircle className="w-3 h-3 ml-1" />
            {status}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الحضور والانصراف</h1>
          <p className="text-muted-foreground">متابعة سجلات الحضور والانصراف للموظفين</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            اليوم
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              const doc = generateAttendanceReport(attendanceRecords, "2024-01-15");
              downloadPDF(doc, "attendance-report-2024-01-15");
              notifyReportGenerated("تقرير الحضور");
            }}
          >
            <FileText className="w-4 h-4" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="bg-card border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stat.color === 'primary' ? 'bg-primary/10 text-primary' :
                  stat.color === 'success' ? 'bg-emerald-500/10 text-emerald-600' :
                  stat.color === 'destructive' ? 'bg-destructive/10 text-destructive' :
                  'bg-amber-500/10 text-amber-600'
                }`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="حاضر">حاضر</SelectItem>
                <SelectItem value="غائب">غائب</SelectItem>
                <SelectItem value="متأخر">متأخر</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              المزيد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            سجل الحضور - الإثنين 15 يناير 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الموظف</TableHead>
                <TableHead className="text-right">اسم الموظف</TableHead>
                <TableHead className="text-right">وقت الحضور</TableHead>
                <TableHead className="text-right">وقت الانصراف</TableHead>
                <TableHead className="text-right">ساعات العمل</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.employeeId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {record.name.charAt(0)}
                      </div>
                      {record.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{record.checkIn}</TableCell>
                  <TableCell className="font-mono">{record.checkOut}</TableCell>
                  <TableCell className="font-mono">{record.workHours}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
