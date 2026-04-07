import type { ID, ISODate } from "@/types/api";

export interface RecruitmentCandidate {
  id: ID;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  status: "applied" | "screening" | "interview" | "offered" | "hired" | "rejected";
  source?: string;
  notes?: string;
  applied_at?: ISODate;
}
