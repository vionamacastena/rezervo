import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api/client";

export interface User {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: { id: number; name: string }[];
  tenant?: {
    id: number;
    name: string;
    slug: string;
    currency: string;
    timezone: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post("/auth/login", {
            email,
            password,
            device_name: "web",
          });
          localStorage.setItem("rezervo_token", data.token);
          set({ user: data.user, token: data.token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.post("/auth/logout");
        } catch {
          // ignore
        }
        localStorage.removeItem("rezervo_token");
        localStorage.removeItem("rezervo_user");
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await apiClient.get("/auth/me");
          set({ user: data.user });
        } catch {
          set({ user: null, token: null });
        }
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: "rezervo_auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
