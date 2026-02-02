import { Users, UserCheck, UserX, Clock, Calendar, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const attendanceData = [
  { day: "السبت", حضور: 45, غياب: 5 },
  { day: "الأحد", حضور: 48, غياب: 2 },
  { day: "الإثنين", حضور: 42, غياب: 8 },
  { day: "الثلاثاء", حضور: 47, غياب: 3 },
  { day: "الأربعاء", حضور: 44, غياب: 6 },
  { day: "الخميس", حضور: 40, غياب: 10 },
];

const departmentData = [
  { name: "الإدارة", value: 15, color: "hsl(200, 98%, 39%)" },
  { name: "المبيعات", value: 25, color: "hsl(198, 93%, 59%)" },
  { name: "التقنية", value: 20, color: "hsl(213, 93%, 67%)" },
  { name: "الموارد البشرية", value: 10, color: "hsl(215, 20%, 65%)" },
];

const recentActivities = [
  { name: "محمد أحمد", action: "تسجيل حضور", time: "08:30 ص", type: "attendance" },
  { name: "سارة علي", action: "طلب إجازة", time: "09:15 ص", type: "leave" },
  { name: "خالد عمر", action: "تسجيل انصراف", time: "05:00 م", type: "attendance" },
  { name: "فاطمة حسن", action: "إجازة مقبولة", time: "10:30 ص", type: "approved" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة على بيانات الموارد البشرية</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الموظفين"
          value={120}
          icon={Users}
          variant="primary"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="الحاضرون اليوم"
          value={98}
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title="الغائبون"
          value={12}
          icon={UserX}
          variant="warning"
        />
        <StatCard
          title="طلبات الإجازة"
          value={8}
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <Card className="lg:col-span-2 bg-card border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              إحصائيات الحضور الأسبوعية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="day" type="category" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    direction: 'rtl'
                  }} 
                />
                <Bar dataKey="حضور" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="غياب" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="bg-card border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              توزيع الأقسام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {departmentData.map((dept) => (
                <div key={dept.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: dept.color }}
                  />
                  <span className="text-muted-foreground">{dept.name}</span>
                  <span className="font-medium">{dept.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">آخر النشاطات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg bg-background"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'attendance' ? 'bg-primary/10 text-primary' :
                    activity.type === 'leave' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {activity.type === 'attendance' ? <Clock className="w-5 h-5" /> :
                     activity.type === 'leave' ? <Calendar className="w-5 h-5" /> :
                     <UserCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.name}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
