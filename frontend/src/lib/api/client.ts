import axios, { AxiosError } from "axios";
import { clearAuthCookie } from "@/lib/auth-cookie";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Request: shto Bearer token nga localStorage
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("rezervo_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: handle 401 (por VETËM jashtë login/book)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      const isAuthArea = path.startsWith("/login") || path.startsWith("/book");

      if (!isAuthArea) {
        localStorage.removeItem("rezervo_token");
        localStorage.removeItem("rezervo_user");
        clearAuthCookie();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
