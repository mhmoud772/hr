import { create } from "zustand";

interface AppState {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommandOpen: () => void;
  isOnline: boolean;
  setOnline: (status: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  toggleCommandOpen: () => set((state) => ({ commandOpen: !state.commandOpen })),
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  setOnline: (status) => set({ isOnline: status }),
}));
