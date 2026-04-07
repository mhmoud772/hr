import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Employee } from "@/types/api";

type DraftEmployee = Partial<Employee> & {
  employeeId?: string;
  department?: string;
  jobTitle?: string;
};

interface DraftState {
  employeeDraft: DraftEmployee | null;
  setEmployeeDraft: (draft: DraftEmployee | null) => void;
  clearEmployeeDraft: () => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      employeeDraft: null,
      setEmployeeDraft: (draft) => set({ employeeDraft: draft }),
      clearEmployeeDraft: () => set({ employeeDraft: null }),
    }),
    {
      name: "hr-companion-drafts",
    }
  )
);
