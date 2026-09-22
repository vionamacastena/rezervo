import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export interface PublicTenant {
  id: number;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  timezone: string;
  currency: string;
}

export interface PublicService {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  duration_label: string;
  price: number;
  currency: string;
  color: string;
  category: string | null;
}

export interface PublicSlot {
  time: string;
  datetime: string;
  ends_at: string;
  available: boolean;
  reason: string | null;
}

export interface BookingResponse {
  message: string;
  reservation: {
    id: number;
    code: string;
    status: string;
    starts_at: string;
    ends_at: string;
    service: { name: string; duration_minutes: number };
    client: { full_name: string; phone: string; email: string | null };
    total_price: number;
    currency: string;
  };
  tenant: { name: string; phone: string | null; address: string | null };
}

export const publicBookingApi = {
  getTenant: (slug: string) =>
    publicApi.get<{ tenant: PublicTenant; services: PublicService[] }>(
      `/public/${slug}`
    ),

  getAvailability: (slug: string, date: string, serviceId: number) =>
    publicApi.get<{
      date: string;
      service_id: number;
      service_duration: number;
      slots: PublicSlot[];
    }>(`/public/${slug}/availability`, {
      params: { date, service_id: serviceId },
    }),

  book: (
    slug: string,
    data: {
      service_id: number;
      starts_at: string;
      first_name: string;
      last_name: string;
      phone: string;
      email?: string;
      notes?: string;
    }
  ) => publicApi.post<BookingResponse>(`/public/${slug}/book`, data),
};
