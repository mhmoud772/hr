import { toast } from "sonner";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  title: string;
  description?: string;
  type?: NotificationType;
  duration?: number;
}

export const notify = ({ title, description, type = "info", duration = 5000 }: NotificationOptions) => {
  const options = {
    description,
    duration,
  };

  switch (type) {
    case "success":
      toast.success(title, options);
      break;
    case "error":
      toast.error(title, options);
      break;
    case "warning":
      toast.warning(title, options);
      break;
    default:
      toast.info(title, options);
  }
};

// HR-specific notifications
export const notifyLeaveRequest = (employeeName: string, leaveType: string) => {
  notify({
    title: "طلب إجازة جديد",
    description: `قدم ${employeeName} طلب إجازة ${leaveType}`,
    type: "info",
    duration: 6000,
  });
};

export const notifyLeaveApproved = (employeeName: string) => {
  notify({
    title: "تمت الموافقة على الإجازة",
    description: `تمت الموافقة على طلب إجازة ${employeeName}`,
    type: "success",
  });
};

export const notifyLeaveRejected = (employeeName: string) => {
  notify({
    title: "تم رفض طلب الإجازة",
    description: `تم رفض طلب إجازة ${employeeName}`,
    type: "error",
  });
};

export const notifyLateArrival = (employeeName: string, arrivalTime: string) => {
  notify({
    title: "تأخر موظف",
    description: `وصل ${employeeName} متأخراً في الساعة ${arrivalTime}`,
    type: "warning",
    duration: 8000,
  });
};

export const notifyEmployeeAbsent = (employeeName: string) => {
  notify({
    title: "غياب موظف",
    description: `${employeeName} لم يسجل حضوره اليوم`,
    type: "warning",
  });
};

export const notifyReportGenerated = (reportType: string) => {
  notify({
    title: "تم إنشاء التقرير",
    description: `تم تصدير ${reportType} بنجاح`,
    type: "success",
  });
};

export const notifyDeviceOffline = (deviceName: string, location: string) => {
  notify({
    title: "جهاز غير متصل",
    description: `الجهاز ${deviceName} في ${location} غير متصل`,
    type: "error",
    duration: 10000,
  });
};

export const notifySyncComplete = (deviceName: string, recordsCount: number) => {
  notify({
    title: "اكتملت المزامنة",
    description: `تمت مزامنة ${recordsCount} سجل من ${deviceName}`,
    type: "success",
  });
};
