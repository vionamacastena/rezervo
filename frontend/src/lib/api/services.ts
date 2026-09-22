import { apiClient } from "./client";

export interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  currency: string;
  color: string;
  category: string | null;
  is_active: boolean;
  sort_order: number;
}

export const servicesApi = {
  list: (params?: any) => apiClient.get<Service[]>("/services", { params }),
  get: (id: number) => apiClient.get(`/services/${id}`),
  create: (data: any) => apiClient.post("/services", data),
  update: (id: number, data: any) => apiClient.put(`/services/${id}`, data),
  delete: (id: number) => apiClient.delete(`/services/${id}`),
};
