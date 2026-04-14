import { create } from "zustand";
import type { AdminReport } from "@/types";

type AdminState = {
  pendingReports: AdminReport[];
  setPendingReports: (reports: AdminReport[]) => void;
  updateReportStatus: (id: string, status: string) => void;
};

export const useAdminStore = create<AdminState>()((set) => ({
  pendingReports: [],
  setPendingReports: (reports) => set({ pendingReports: reports }),
  updateReportStatus: (id, status) =>
    set((state) => ({
      pendingReports: state.pendingReports.map((r) =>
        r.id === id ? { ...r, status } : r,
      ),
    })),
}));
