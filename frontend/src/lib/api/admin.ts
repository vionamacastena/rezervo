import { apiClient } from "./client";

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: "active" | "trial" | "suspended";
  currency: string;
  timezone: string;
  created_at: string;
  users_count?: number;
  services_count?: number;
  reservations_count?: number;
  clients_count?: number;
  revenue_total?: number;
  revenue_month?: number;
}

export interface UserRow {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  last_login_at: string | null;
  created_at: string;
  roles: { id: number; name: string }[];
  tenant?: { id: number; name: string; slug: string };
}

export const adminApi = {
  // Platform
  platformStats: () => apiClient.get("/admin/platform-stats"),

  // Tenants
  listTenants: (params?: any) => apiClient.get("/admin/tenants", { params }),
  getTenant: (id: number | string) => apiClient.get(`/admin/tenants/${id}`),
  createTenant: (data: any) => apiClient.post("/admin/tenants", data),
  updateTenant: (id: number | string, data: any) => apiClient.put(`/admin/tenants/${id}`, data),
  deleteTenant: (id: number | string) => apiClient.delete(`/admin/tenants/${id}`),
  updateTenantStatus: (id: number | string, status: string) =>
    apiClient.patch(`/admin/tenants/${id}/status`, { status }),

  // Users
  listUsers: (params?: any) => apiClient.get("/admin/users", { params }),
  getUser: (id: number | string) => apiClient.get(`/admin/users/${id}`),
  createUser: (data: any) => apiClient.post("/admin/users", data),
  updateUser: (id: number | string, data: any) => apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id: number | string) => apiClient.delete(`/admin/users/${id}`),
  updateUserStatus: (id: number | string, status: string) =>
    apiClient.patch(`/admin/users/${id}/status`, { status }),
  resetUserPassword: (id: number | string, password: string) =>
    apiClient.post(`/admin/users/${id}/reset-password`, { password }),
};

// Shto në fund - Templates
declare module "./admin" {
  interface AdminApi {
    listTemplates: () => Promise<{ data: any[] }>;
  }
}
