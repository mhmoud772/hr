import { useMemo, useState } from "react";
import {
  useLeavesQuery,
  useCreateLeave,
  useUploadLeaveAttachment,
  useLeaveBalancesQuery,
} from "@/features/leaves/hooks/useLeaves";
import { buildLeavePayload } from "../lib/leave-payload";
import type { Leave, ID } from "@/types/api";

export function useSelfServiceLeaves(employeeId?: ID) {
  const leavesQuery = useLeavesQuery();
  const balancesQuery = useLeaveBalancesQuery(employeeId);
  const createLeave = useCreateLeave();
  const uploadAttachment = useUploadLeaveAttachment();

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Pre-compute balance map keyed by leave_type
  const balanceByType = useMemo(() => {
    const balances = balancesQuery.data ?? [];
    const map = new Map<string, { total: number; used: number; remaining: number }>();
    balances.forEach((b) => {
      const total = b.total_days ?? 0;
      const used = b.used_days ?? 0;
      map.set(b.leave_type, { total, used, remaining: Math.max(0, total - used) });
    });
    return map;
  }, [balancesQuery.data]);

  const openDetails = (leave: Leave) => {
    setSelectedLeave(leave);
    setDetailsOpen(true);
  };

  /**
   * Handles leave creation without any `as any` casts.
   * Payload mapping is fully delegated to buildLeavePayload().
   */
  const handleSave = async (request: Partial<Leave>, files: File[]) => {
    const payload = buildLeavePayload(request);
    const created = await createLeave.mutateAsync(payload);
    if (created?.id) {
      for (const file of files) {
        await uploadAttachment.mutateAsync({ id: created.id, file });
      }
    }
    leavesQuery.refetch();
  };

  return {
    leavesQuery,
    balancesQuery,
    balanceByType,
    leaveDialogOpen,
    setLeaveDialogOpen,
    selectedLeave,
    detailsOpen,
    setDetailsOpen,
    openDetails,
    handleSave,
  };
}
