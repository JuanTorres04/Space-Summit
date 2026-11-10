import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiErrorBody, TokenPair } from "../types";
import { useToastStore } from "../store/toastStore";

const API_URL = import.meta.env.VITE_API_URL;

export const tokenStore = {
  getAccess: (): string | null => localStorage.getItem("access"),
  getRefresh: (): string | null => localStorage.getItem("refresh"),
  setTokens: (tokens: TokenPair): void => {
    localStorage.setItem("access", tokens.access);
    localStorage.setItem("refresh", tokens.refresh);
  },
  setAccess: (access: string): void => localStorage.setItem("access", access),
  clear: (): void => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  },
};

export const api = axios.create({ baseURL: API_URL });

// Attach the access token to every request
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) throw new Error("No refresh token");
  const { data } = await axios.post<{ access: string }>(
    `${API_URL}/auth/refresh/`,
    {
      refresh,
    },
  );
  tokenStore.setAccess(data.access);
  return data.access;
}

// On a 401, refresh the token once and retry the original request
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const isLogin = original?.url?.includes("/auth/login/");

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isLogin &&
      tokenStore.getRefresh()
    ) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newAccess = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        tokenStore.clear();
        window.dispatchEvent(new Event("auth:logout"));
      }
    }
    const status = error.response?.status;
    if (
      !error.response ||
      status === 403 ||
      status === 404 ||
      (status !== undefined && status >= 500)
    ) {
      useToastStore.getState().push(getErrorMessage(error));
    }
    return Promise.reject(error);
  },
);

/** Turns any API failure into one readable message for the UI. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response)
      return "Cannot reach the server. Is the backend running?";
    const data = error.response.data;
    if (data) {
      if (typeof data.detail === "string") return data.detail;
      const first = Object.values(data)[0];
      if (Array.isArray(first) && first.length > 0) return first[0];
      if (typeof first === "string") return first;
    }
    return `Request failed (${error.response.status})`;
  }
  return "Something went wrong.";
}
