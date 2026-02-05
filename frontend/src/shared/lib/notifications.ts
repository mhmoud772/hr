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
    title: "New leave request",
    description: `${employeeName} submitted a ${leaveType} request.`,
    type: "info",
    duration: 6000,
  });
};

export const notifyLeaveApproved = (employeeName: string) => {
  notify({
    title: "Leave approved",
    description: `Leave request approved for ${employeeName}.`,
    type: "success",
  });
};

export const notifyLeaveRejected = (employeeName: string) => {
  notify({
    title: "Leave rejected",
    description: `Leave request rejected for ${employeeName}.`,
    type: "error",
  });
};

export const notifyLateArrival = (employeeName: string, arrivalTime: string) => {
  notify({
    title: "Late arrival",
    description: `${employeeName} arrived late at ${arrivalTime}.`,
    type: "warning",
    duration: 8000,
  });
};

export const notifyEmployeeAbsent = (employeeName: string) => {
  notify({
    title: "Employee absent",
    description: `${employeeName} did not check in today.`,
    type: "warning",
  });
};

export const notifyReportGenerated = (reportType: string) => {
  notify({
    title: "Report generated",
    description: `${reportType} exported successfully.`,
    type: "success",
  });
};

export const notifyDeviceOffline = (deviceName: string, location: string) => {
  notify({
    title: "Device offline",
    description: `${deviceName} at ${location} is offline.`,
    type: "error",
    duration: 10000,
  });
};

export const notifySyncComplete = (deviceName: string, recordsCount: number) => {
  notify({
    title: "Sync complete",
    description: `Synced ${recordsCount} records from ${deviceName}.`,
    type: "success",
  });
};
