import { apiClient } from "./client";

export interface AppNotification {
  id: string;
  data: {
    type: string;
    title: string;
    message: string;
    reservation_id?: number;
    reservation_code?: string;
    client_name?: string;
    client_phone?: string;
    service_name?: string;
    starts_at?: string;
    total_price?: number;
    currency?: string;
  };
  read_at: string | null;
  created_at: string;
}

export const notificationsApi = {
  list: () => apiClient.get<{ notifications: AppNotification[]; unread_count: number }>("/notifications"),
  unreadCount: () => apiClient.get<{ count: number }>("/notifications/unread-count"),
  markAsRead: (id: string) => apiClient.post(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.post("/notifications/read-all"),
  delete: (id: string) => apiClient.delete(`/notifications/${id}`),
};
