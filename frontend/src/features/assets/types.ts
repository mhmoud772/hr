import type { ID, ISODate } from "@/types/api";

export interface Asset {
  id: ID;
  name: string;
  serial_number?: string;
  category?: string;
  status: "available" | "assigned" | "maintenance" | "retired";
  assignedTo?: ID | null;
  assignedToCode?: ID | null;
  assignedToName?: string;
  assigned_at?: ISODate;
  notes?: string;
}
