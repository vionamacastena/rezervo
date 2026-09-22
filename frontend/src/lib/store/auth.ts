import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth-cookie";

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
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<User | null>;
  hydrateFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  hydrateFromStorage: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("rezervo_token");
    const userStr = localStorage.getItem("rezervo_user");
    let user: User | null = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch {
      user = null;
    }
    set({ token, user });
  },

  login: async (email, password) => {
    const { data } = await apiClient.post("/auth/login", {
      email,
      password,
      device_name: "web",
    });

    if (!data?.token) {
      throw new Error("Token nuk u kthye nga serveri.");
    }

    // Ruaj në localStorage (për axios interceptor)
    localStorage.setItem("rezervo_token", data.token);
    localStorage.setItem("rezervo_user", JSON.stringify(data.user));

    // Vendos cookie për guard-in e layout-eve
    setAuthCookie();

    set({ user: data.user, token: data.token });

    // Merr të dhënat e plota (me tenant)
    try {
      const { data: meData } = await apiClient.get("/auth/me");
      if (meData?.user) {
        localStorage.setItem("rezervo_user", JSON.stringify(meData.user));
        set({ user: meData.user });
        return meData.user;
      }
    } catch {
      // vazhdo me userin bazë
    }

    return data.user;
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("rezervo_token");
    localStorage.removeItem("rezervo_user");
    clearAuthCookie();
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await apiClient.get("/auth/me");
      if (data?.user) {
        localStorage.setItem("rezervo_user", JSON.stringify(data.user));
        set({ user: data.user });
        return data.user;
      }
    } catch {
      // 401 → token invalid, pastro
      localStorage.removeItem("rezervo_token");
      localStorage.removeItem("rezervo_user");
      clearAuthCookie();
      set({ user: null, token: null });
    }
    return null;
  },
}));
