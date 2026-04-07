import type { ID, ISODate } from "@/types/api";

export interface AuditLog {
  id: ID;
  user?: ID | null;
  userName?: string;
  action: "create" | "update" | "delete";
  model_name: string;
  object_id: string;
  changes?: Record<string, { from: string; to: string }>;
  created_at?: ISODate;
}
