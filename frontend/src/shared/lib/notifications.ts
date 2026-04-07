import { toast } from "sonner";
import i18n from "@/i18n/i18n";

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
    title: i18n.t("notification_leave_request_title"),
    description: i18n.t("notification_leave_request_desc", { employeeName, leaveType }),
    type: "info",
    duration: 6000,
  });
};

export const notifyLeaveApproved = (employeeName: string) => {
  notify({
    title: i18n.t("notification_leave_approved_title"),
    description: i18n.t("notification_leave_approved_desc", { employeeName }),
    type: "success",
  });
};

export const notifyLeaveRejected = (employeeName: string) => {
  notify({
    title: i18n.t("notification_leave_rejected_title"),
    description: i18n.t("notification_leave_rejected_desc", { employeeName }),
    type: "error",
  });
};

export const notifyLateArrival = (employeeName: string, arrivalTime: string) => {
  notify({
    title: i18n.t("notification_late_arrival_title"),
    description: i18n.t("notification_late_arrival_desc", { employeeName, arrivalTime }),
    type: "warning",
    duration: 8000,
  });
};

export const notifyEmployeeAbsent = (employeeName: string) => {
  notify({
    title: i18n.t("notification_employee_absent_title"),
    description: i18n.t("notification_employee_absent_desc", { employeeName }),
    type: "warning",
  });
};

export const notifyReportGenerated = (reportType: string) => {
  notify({
    title: i18n.t("notification_report_generated_title"),
    description: i18n.t("notification_report_generated_desc", { reportType }),
    type: "success",
  });
};

export const notifyDeviceOffline = (deviceName: string, location: string) => {
  notify({
    title: i18n.t("notification_device_offline_title"),
    description: i18n.t("notification_device_offline_desc", { deviceName, location }),
    type: "error",
    duration: 10000,
  });
};

export const notifySyncComplete = (deviceName: string, recordsCount: number) => {
  notify({
    title: i18n.t("notification_sync_complete_title"),
    description: i18n.t("notification_sync_complete_desc", { deviceName, recordsCount }),
    type: "success",
  });
};
