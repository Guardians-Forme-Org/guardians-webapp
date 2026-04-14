import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

type AuthState = {
  user: User | null;
  isAdmin: boolean;
  setUser: (user: User) => void;
  setAdmin: (isAdmin: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAdmin: false,
      setUser: (user) => set({ user }),
      setAdmin: (isAdmin) => set({ isAdmin }),
      logout: () => set({ user: null, isAdmin: false }),
    }),
    { name: "gotf-auth" },
  ),
);
