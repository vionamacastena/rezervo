import { apiClient } from "./client";

export interface BlockedSlot {
  id: number;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  creator?: { id: number; name: string };
  created_at: string;
}

export const blockedSlotsApi = {
  list: async (from: string, to: string): Promise<BlockedSlot[]> => {
    const { data } = await apiClient.get("/blocked-slots", {
      params: { from, to },
    });
    return Array.isArray(data) ? data : [];
  },
  create: (data: { starts_at: string; ends_at: string; reason?: string }) =>
    apiClient.post("/blocked-slots", data),
  delete: (id: number) => apiClient.delete(`/blocked-slots/${id}`),
};
