/**
 * Speed Money API Client
 *
 * Lightweight, type-safe HTTP client for communicating with the Speed Money backend.
 * Configured via VITE_API_URL environment variable.
 */

export const TOKEN_STORAGE_KEY = "speedmoney_token";
export const USER_STORAGE_KEY = "speedmoney_user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "AGENT" | "ADMIN";
  status: string;
  createdAt?: string;
}

export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public data: any;

  constructor(message: string, status: number, statusText: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Retrieve the active JWT token from browser storage.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Save the JWT token to browser storage.
 */
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

/**
 * Retrieve stored user metadata from browser storage.
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Save user metadata to browser storage.
 */
export function setStoredUser(user: AuthUser): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
}

/**
 * Remove stored credentials.
 */
export function clearAuth(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

/**
 * Resolve the API base URL from Vite environment variables or default to port 5000.
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === "string") {
    return envUrl.replace(/\/+$/, "");
  }
  return "http://localhost:5000/api";
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

/**
 * Core HTTP request handler.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, skipAuth = false, headers: customHeaders, ...customInit } = options;

  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  let url = `${baseUrl}${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const headers = new Headers(customHeaders);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!skipAuth && !headers.has("Authorization")) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (
      (typeof FormData !== "undefined" && body instanceof FormData) ||
      (typeof Blob !== "undefined" && body instanceof Blob) ||
      (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) ||
      typeof body === "string"
    ) {
      requestBody = body as BodyInit;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      requestBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...customInit,
      headers,
      body: requestBody,
    });
  } catch (err: any) {
    throw new ApiError(
      err?.message ? `Network request failed: ${err.message}` : "Network request failed. Server may be unreachable.",
      0,
      "NETWORK_ERROR"
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as unknown as T;
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let responseData: any = null;
  if (isJson) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      (responseData && typeof responseData === "object" && (responseData.message || responseData.error)) ||
      `Request failed with status ${response.status} (${response.statusText || "Error"})`;

    throw new ApiError(
      errorMessage,
      response.status,
      response.statusText,
      responseData
    );
  }

  return responseData as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "POST", body }),

  put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};

/**
 * Authentication service helpers.
 */
export async function loginApi(
  email: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  const data = await api.post<{ success: boolean; token: string; user: AuthUser; message?: string }>(
    "/auth/login",
    {
      email: email.trim().toLowerCase(),
      password,
    },
    { skipAuth: true }
  );

  return { token: data.token, user: data.user };
}

export async function registerApi(
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  const data = await api.post<{ success: boolean; token: string; user: AuthUser; message?: string }>(
    "/auth/register",
    {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
    },
    { skipAuth: true }
  );

  return { token: data.token, user: data.user };
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const data = await api.get<{ success: boolean; user: AuthUser }>("/auth/me");
    if (data?.user) {
      setStoredUser(data.user);
      return data.user;
    }
    return null;
  } catch {
    clearAuth();
    return null;
  }
}

export default api;
