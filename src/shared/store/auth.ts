import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: { id: number; email: string; full_name: string; role: string; seller_id: number } | null;
  mustChangePassword: boolean;
  setToken: (token: string) => void;
  setUser: (user: AuthState["user"]) => void;
  setMustChange: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      mustChangePassword: false,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setMustChange: (v) => set({ mustChangePassword: v }),
      logout: () => set({ token: null, user: null, mustChangePassword: false }),
    }),
    { name: "seller-auth" }
  )
);
