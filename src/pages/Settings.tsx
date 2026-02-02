import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Building, Clock, Calendar, Bell, Shield, Save, Monitor, Languages } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { useSettings } from "@/hooks/use-settings";

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [companySettings, setCompanySettings] = useSettings("company-settings", {
    name: "شركة المثال للتقنية",
    nameEn: "Example Tech Company",
    email: "info@example.com",
    phone: "+966 12 345 6789",
    address: "الرياض، المملكة العربية السعودية",
  });

  const [attendanceSettings, setAttendanceSettings] = useSettings("attendance-settings", {
    workStartTime: "08:00",
    workEndTime: "17:00",
    lateThreshold: "15",
    earlyLeaveThreshold: "15",
    enableGeolocation: true,
    enableFaceRecognition: false,
  });

  const [leaveSettings, setLeaveSettings] = useSettings("leave-settings", {
    annualLeaveDefault: "21",
    sickLeaveDefault: "14",
    emergencyLeaveDefault: "5",
    requireApproval: true,
    minAdvanceNotice: "3",
  });

  const [notificationSettings, setNotificationSettings] = useSettings("notification-settings", {
    emailNotifications: true,
    smsNotifications: false,
    leaveRequestNotify: true,
    attendanceAlerts: true,
    weeklyReports: true,
  });

  const [generalSettings, setGeneralSettings] = useSettings("general-settings", {
    theme: theme as string,
    language: "ar",
    timezone: "Asia/Riyadh",
  });

  // Update theme when general settings change
  useEffect(() => {
    if (generalSettings.theme) {
      setTheme(generalSettings.theme as any);
    }
  }, [generalSettings.theme, setTheme]);

  const handleSave = (section: string) => {
    toast({
      title: "تم الحفظ",
      description: `تم حفظ إعدادات ${section} بنجاح`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة إعدادات النظام</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="company" className="gap-2">
            <Building className="w-4 h-4" />
            بيانات الشركة
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Monitor className="w-4 h-4" />
            إعدادات عامة
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="w-4 h-4" />
            الحضور والانصراف
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2">
            <Calendar className="w-4 h-4" />
            الإجازات
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            الإشعارات
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                بيانات الشركة
              </CardTitle>
              <CardDescription>معلومات الشركة الأساسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الشركة (عربي)</Label>
                  <Input
                    value={companySettings.name}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم الشركة (إنجليزي)</Label>
                  <Input
                    value={companySettings.nameEn}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, nameEn: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={companySettings.email}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, email: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={companySettings.phone}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, phone: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input
                  value={companySettings.address}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, address: e.target.value })
                  }
                />
              </div>
              <Button onClick={() => handleSave("بيانات الشركة")}>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                إعدادات عامة
              </CardTitle>
              <CardDescription>ضبط مظهر النظام واللغة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المظهر (Theme)</Label>
                  <Select 
                    value={generalSettings.theme} 
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, theme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المظهر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">فاتح (Light)</SelectItem>
                      <SelectItem value="dark">داكن (Dark)</SelectItem>
                      <SelectItem value="system">النظام (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>اللغة (Language)</Label>
                  <Select 
                    value={generalSettings.language} 
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر اللغة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                      <SelectItem value="en">الإنجليزية (English)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>المنطقة الزمنية</Label>
                <Select 
                  value={generalSettings.timezone} 
                  onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنطقة الزمنية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                    <SelectItem value="Africa/Cairo">القاهرة (GMT+2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => handleSave("الإعدادات العامة")}>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Settings */}
        <TabsContent value="attendance">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                إعدادات الحضور والانصراف
              </CardTitle>
              <CardDescription>ضبط أوقات الدوام وقواعد التأخير</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>وقت بداية الدوام</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.workStartTime}
                    onChange={(e) =>
                      setAttendanceSettings({
                        ...attendanceSettings,
                        workStartTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>وقت نهاية الدوام</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.workEndTime}
                    onChange={(e) =>
                      setAttendanceSettings({
                        ...attendanceSettings,
                        workEndTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>حد التأخير المسموح (بالدقائق)</Label>
                  <Input
                    type="number"
                    value={attendanceSettings.lateThreshold}
                    onChange={(e) =>
                      setAttendanceSettings({
                        ...attendanceSettings,
                        lateThreshold: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>حد الخروج المبكر المسموح (بالدقائق)</Label>
                  <Input
                    type="number"
                    value={attendanceSettings.earlyLeaveThreshold}
                    onChange={(e) =>
                      setAttendanceSettings({
                        ...attendanceSettings,
                        earlyLeaveThreshold: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">خيارات متقدمة</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">تفعيل الموقع الجغرافي</p>
                    <p className="text-sm text-muted-foreground">
                      التحقق من موقع الموظف عند تسجيل الحضور
                    </p>
                  </div>
                  <Switch
                    checked={attendanceSettings.enableGeolocation}
                    onCheckedChange={(checked) =>
                      setAttendanceSettings({
                        ...attendanceSettings,
                        enableGeolocation: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">التعرف على الوجه</p>
                    <p className="text-sm text-muted-foreground">
                      استخدام التعرف على الوجه للتحقق من الهوية
                    </p>
                  </div>
                  <Switch
                    checked={attendanceSettings.enableFaceRecognition}
                    onCheckedChange={(checked) =>
                      setAttendanceSettings({
                        ...attendanceSettings,
                        enableFaceRecognition: checked,
                      })
                    }
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSave("الحضور والانصراف")}>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Settings */}
        <TabsContent value="leaves">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                إعدادات الإجازات
              </CardTitle>
              <CardDescription>ضبط أرصدة الإجازات الافتراضية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>الإجازة السنوية (يوم)</Label>
                  <Input
                    type="number"
                    value={leaveSettings.annualLeaveDefault}
                    onChange={(e) =>
                      setLeaveSettings({
                        ...leaveSettings,
                        annualLeaveDefault: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الإجازة المرضية (يوم)</Label>
                  <Input
                    type="number"
                    value={leaveSettings.sickLeaveDefault}
                    onChange={(e) =>
                      setLeaveSettings({
                        ...leaveSettings,
                        sickLeaveDefault: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الإجازة الطارئة (يوم)</Label>
                  <Input
                    type="number"
                    value={leaveSettings.emergencyLeaveDefault}
                    onChange={(e) =>
                      setLeaveSettings({
                        ...leaveSettings,
                        emergencyLeaveDefault: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>الحد الأدنى لتقديم طلب الإجازة (بالأيام)</Label>
                <Input
                  type="number"
                  value={leaveSettings.minAdvanceNotice}
                  onChange={(e) =>
                    setLeaveSettings({
                      ...leaveSettings,
                      minAdvanceNotice: e.target.value,
                    })
                  }
                  className="w-48"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">طلب الموافقة على الإجازات</p>
                  <p className="text-sm text-muted-foreground">
                    يتطلب موافقة المدير على طلبات الإجازة
                  </p>
                </div>
                <Switch
                  checked={leaveSettings.requireApproval}
                  onCheckedChange={(checked) =>
                    setLeaveSettings({
                      ...leaveSettings,
                      requireApproval: checked,
                    })
                  }
                />
              </div>
              
              <Button onClick={() => handleSave("الإجازات")}>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                إعدادات الإشعارات
              </CardTitle>
              <CardDescription>التحكم في الإشعارات والتنبيهات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">قنوات الإشعارات</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">إشعارات البريد الإلكتروني</p>
                    <p className="text-sm text-muted-foreground">
                      استلام الإشعارات عبر البريد الإلكتروني
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">الرسائل النصية SMS</p>
                    <p className="text-sm text-muted-foreground">
                      استلام الإشعارات عبر الرسائل النصية
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        smsNotifications: checked,
                      })
                    }
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">أنواع الإشعارات</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">طلبات الإجازة</p>
                    <p className="text-sm text-muted-foreground">
                      إشعار عند استلام طلب إجازة جديد
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.leaveRequestNotify}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        leaveRequestNotify: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">تنبيهات الحضور</p>
                    <p className="text-sm text-muted-foreground">
                      تنبيه عند التأخير أو الغياب
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.attendanceAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        attendanceAlerts: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">التقارير الأسبوعية</p>
                    <p className="text-sm text-muted-foreground">
                      استلام ملخص أسبوعي للحضور والإجازات
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        weeklyReports: checked,
                      })
                    }
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSave("الإشعارات")}>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
