import axios from "axios";
import { useAuthStore } from "../store/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const res = await axios.post("/api/v1/seller/auth/refresh", {}, { withCredentials: true });
        useAuthStore.getState().setToken(res.data.access_token);
        error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
        return api(error.config);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
