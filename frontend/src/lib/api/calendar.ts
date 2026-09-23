import { apiClient } from "./client";

export interface CalendarReservation {
  id: number;
  code: string;
  status: "draft" | "tentative" | "confirmed" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string;
  total_price: number;
  currency: string;
  service?: { id: number; name: string; color: string } | null;
  client: { id: number; full_name: string; phone: string };
  notes?: string | null;
}

export const calendarApi = {
  /**
   * Merr rezervimet për një periudhë (from + to ISO dates).
   * Backend kthen paginated: { data: { data: [...], meta } }
   * Ne ekstraktojmë array-in dhe e kthejmë direkt.
   */
  list: async (from: string, to: string): Promise<CalendarReservation[]> => {
    const { data } = await apiClient.get("/reservations", {
      params: { from, to, per_page: 500 },
    });
    // data = { data: { data: [...], links, meta } }  (paginated)
    // ose data = { data: [...] }  (jo paginated)
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (data.data && Array.isArray(data.data.data)) return data.data.data;
    return [];
  },
};
