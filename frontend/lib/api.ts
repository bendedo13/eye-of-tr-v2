/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "@/lib/toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; params?: Record<string, any> } = {}
): Promise<T> {
  const { token, params, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  // Build URL with query params (avoid double /api)
  const base = (API_BASE || "").replace(/\/+$/, "");
  let normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    normalizedPath = normalizedPath.slice(4);
  }
  let url = `${base}${normalizedPath}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) {
        toast.warning("Planlı bakım çalışması, lütfen sonra tekrar deneyin.");
      }
      const err = await res.json().catch(() => ({ detail: res.statusText }));

      // Handle network errors or server downtime gracefully
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new APIError("Sunucu şu anda yoğun veya bakımda. Lütfen birazdan tekrar deneyin.", res.status);
      }

      throw new APIError(
        err.error || err.detail || `HTTP ${res.status}`,
        res.status,
        err
      );
    }
    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      toast.error("İstek zaman aşımına uğradı. Bağlantınızı kontrol edin.");
      throw new APIError("Timeout", 408);
    }
    throw error;
  }
}

// API client with methods
export const api = {
  get: <T = any>(path: string, options?: RequestInit & { token?: string; params?: Record<string, any> }) => 
    apiFetch<T>(path, { ...options, method: "GET" }),
  
  post: <T = any>(path: string, body?: any, options?: RequestInit & { token?: string }) => {
    const isFormData = body instanceof FormData;
    const init = { ...options };
    if (!isFormData) {
      init.headers = { 
        "Content-Type": "application/json", 
        ...(options?.headers as Record<string, string> || {}) 
      };
    } else if (options?.headers) {
      init.headers = options.headers;
    }
    return apiFetch<T>(path, { 
      ...init, 
      method: "POST", 
      body: isFormData ? body : JSON.stringify(body)
    });
  },
  
  put: <T = any>(path: string, body?: any, options?: RequestInit & { token?: string }) => 
    apiFetch<T>(path, { 
      ...options, 
      method: "PUT", 
      body: body ? JSON.stringify(body) : undefined 
    }),
  
  patch: <T = any>(path: string, body?: any, options?: RequestInit & { token?: string }) => 
    apiFetch<T>(path, { 
      ...options, 
      method: "PATCH", 
      body: body ? JSON.stringify(body) : undefined 
    }),
  
  delete: <T = any>(path: string, options?: RequestInit & { token?: string }) => 
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "server";
  const key = "face-seek-device-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(key, id);
  return id;
}

export async function register(email: string, username: string, password: string, referralCode?: string) {
  const deviceId = getOrCreateDeviceId();
  if (!deviceId || deviceId === "server") {
    throw new APIError("Cihaz kimliği oluşturulamadı. Lütfen tarayıcınızın localStorage'ı desteklediğinden emin olun.", 400);
  }
  const result = await api.post<{ access_token?: string; verification_required?: boolean; debug_code?: string }>("/auth/register", 
    { email, username, password, referral_code: referralCode, device_id: deviceId }
  );
  return { access_token: result.access_token, verification_required: !!result.verification_required, debug_code: result.debug_code };
}

export async function login(email: string, password: string) {
  const deviceId = getOrCreateDeviceId();
  if (!deviceId || deviceId === "server") {
    throw new APIError("Cihaz kimliği oluşturulamadı. Lütfen tarayıcınızın localStorage'ı desteklediğinden emin olun.", 400);
  }
  const result = await api.post<{ access_token: string }>("/auth/login", 
    { email, password, device_id: deviceId }
  );
  return { access_token: result.access_token };
}

export async function me(token: string) {
  return api.get<any>("/auth/me", { token });
}

export async function verifyEmail(email: string, code: string) {
  const result = await api.post<{ access_token: string }>("/auth/verify-email", 
    { email, code, device_id: getOrCreateDeviceId() }
  );
  return { access_token: result.access_token };
}

export async function resendVerificationCode(email: string) {
  return api.post<{ status: string; debug_code?: string }>("/auth/resend-code", 
    { email, device_id: getOrCreateDeviceId() }
  );
}

export async function getDashboardStats(token: string) {
  return api.get<any>("/dashboard/stats", { token });
}

export async function getLiveStats() {
  return { total_searches: 0, active_users: 0 };
}

export async function getPricingPlans() {
  const data = await api.get<any>("/pricing/plans");
  return data.plans;
}

export async function subscribe(token: string, planId: string) {
  return api.post<any>("/pricing/subscribe", { plan_id: planId }, { token });
}

export async function requestBankTransfer(
  token: string,
  payload: { plan_id?: string | null; credits?: number | null; amount: number; currency?: string; note?: string }
) {
  return api.post<any>("/pricing/bank-transfer", payload, { token });
}

export async function createGuestBankInquiry(payload: {
  name: string;
  email: string;
  phone?: string;
  desired_plan?: string;
  desired_credits?: number;
  message?: string;
}) {
  return api.post<any>("/public/bank-transfer-inquiry", payload);
}

export async function confirmPayment(token: string, paymentId: number) {
  return api.post<any>(`/pricing/confirm-payment/${paymentId}`, undefined, { token });
}

export async function getCurrentSubscription(token: string) {
  return api.get<any>("/pricing/subscription", { token });
}

export async function requestPasswordReset(email: string, locale: string) {
  const base =
    typeof window !== "undefined" ? `${window.location.origin}/${locale}/reset-password` : `/${locale}/reset-password`;
  return api.post<{ status: string; debug_reset_url?: string }>("/auth/request-password-reset", 
    { email, device_id: getOrCreateDeviceId(), reset_url_base: base }
  );
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  return api.post<{ status: string }>("/auth/reset-password", 
    { email, token, new_password: newPassword, device_id: getOrCreateDeviceId() }
  );
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  return api.post<{ status: string }>("/auth/change-password", 
    { current_password: currentPassword, new_password: newPassword },
    { token }
  );
}

export async function updateProfile(token: string, username: string) {
  return api.patch<any>("/auth/profile", { username }, { token });
}

export async function deleteAccount(token: string) {
  return api.delete<{ status: string }>("/auth/account", { token });
}

export interface AdvancedSearchParams {
  search_precision: "low" | "medium" | "high";
  region_filter?: string;
  confidence_threshold: number;
  max_results: number;
  enable_ai_explanation: boolean;
  include_facecheck?: boolean;
}

export async function advancedSearchFace(
  token: string,
  file: File,
  params: AdvancedSearchParams
) {
  const formData = new FormData();
  formData.append("file", file);

  const queryParams = new URLSearchParams({
    search_precision: params.search_precision,
    confidence_threshold: params.confidence_threshold.toString(),
    max_results: params.max_results.toString(),
    enable_ai_explanation: params.enable_ai_explanation.toString(),
    include_facecheck: (params.include_facecheck || false).toString(),
  });

  if (params.region_filter) {
    queryParams.append("region_filter", params.region_filter);
  }

  const res = await fetch(
    `${API_BASE}/search-face-advanced?${queryParams.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    if (res.status === 402) {
      throw new APIError("Insufficient credits", 402);
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new APIError(
      err.error || err.detail || `HTTP ${res.status}`,
      res.status,
      err
    );
  }

  return res.json();
}
