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

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(`${API_BASE}${path}`, { 
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
  const result = await api<{ access_token?: string; verification_required?: boolean; debug_code?: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password, referral_code: referralCode, device_id: getOrCreateDeviceId() }),
  });
  return { access_token: result.access_token, verification_required: !!result.verification_required, debug_code: result.debug_code };
}

export async function login(email: string, password: string) {
  const result = await api<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, device_id: getOrCreateDeviceId() }),
  });
  return { access_token: result.access_token };
}

export async function me(token: string) {
  return api<any>("/auth/me", { method: "GET", token });
}

export async function verifyEmail(email: string, code: string) {
  const result = await api<{ access_token: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code, device_id: getOrCreateDeviceId() }),
  });
  return { access_token: result.access_token };
}

export async function resendVerificationCode(email: string) {
  return api<{ status: string; debug_code?: string }>("/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email, device_id: getOrCreateDeviceId() }),
  });
}

export async function getDashboardStats(token: string) {
  return api<any>("/dashboard/stats", { method: "GET", token });
}

export async function getLiveStats() {
  return { total_searches: 0, active_users: 0 };
}

export async function getPricingPlans() {
  const data = await api<any>("/pricing/plans");
  return data.plans;
}

export async function subscribe(token: string, planId: string) {
  return api<any>("/pricing/subscribe", {
    method: "POST",
    token,
    body: JSON.stringify({ plan_id: planId }),
  });
}

export async function confirmPayment(token: string, paymentId: number) {
  return api<any>(`/pricing/confirm-payment/${paymentId}`, {
    method: "POST",
    token,
  });
}

export async function getCurrentSubscription(token: string) {
  return api<any>("/pricing/subscription", {
    method: "GET",
    token,
  });
}

export async function requestPasswordReset(email: string, locale: string) {
  const base =
    typeof window !== "undefined" ? `${window.location.origin}/${locale}/reset-password` : `/${locale}/reset-password`;
  return api<{ status: string; debug_reset_url?: string }>("/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ email, device_id: getOrCreateDeviceId(), reset_url_base: base }),
  });
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  return api<{ status: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, token, new_password: newPassword, device_id: getOrCreateDeviceId() }),
  });
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  return api<{ status: string }>("/auth/change-password", {
    method: "POST",
    token,
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

export async function updateProfile(token: string, username: string) {
  return api<any>("/auth/profile", {
    method: "PATCH",
    token,
    body: JSON.stringify({ username }),
  });
}

export async function deleteAccount(token: string) {
  return api<{ status: string }>("/auth/account", {
    method: "DELETE",
    token,
  });
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
