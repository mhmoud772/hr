import React from "react";
import { useTranslation } from "react-i18next";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import type { Leave, LeaveApproval } from "@/types/api";

interface LeaveDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave: Leave | null;
}

export function LeaveDetailsSheet({
  open,
  onOpenChange,
  leave,
}: LeaveDetailsSheetProps) {
  const { t } = useTranslation();

  if (!leave) return null;

  const details = [
    { label: t("from_date"), value: leave.startDate },
    { label: t("to_date"), value: leave.endDate },
    { label: t("status"), value: t(leave.status) },
    { label: t("reason"), value: leave.reason || "-" },
  ];

  return (
    <DetailsSheet
      open={open}
      onOpenChange={onOpenChange}
      title={leave.employeeName || ""}
      subtitle={`${t("leave_details_title")} ${t(`leave_type_${leave.leaveType}`)}`}
      details={details}
    >
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">{t("approval_log")}</h4>
          <div className="space-y-2">
            {!leave.approvals || leave.approvals.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("no_data")}</p>
            ) : (
              leave.approvals.map((approval: LeaveApproval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {approval.approverName || t("system")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {approval.decided_at || ""}
                    </span>
                  </div>
                  <span className={`font-semibold ${
                    approval.status === 'approved' ? 'text-success' : 'text-destructive'
                  }`}>
                    {t(approval.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DetailsSheet>
  );
}
