import type { ID, ISODate } from "@/types/api";

export interface Notification {
  id: ID;
  title: string;
  description?: string;
  read?: boolean;
  createdAt?: ISODate;
  type?: "info" | "warning" | "success" | "error";
}
