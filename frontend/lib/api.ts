/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new APIError(
      err.error || err.detail || `HTTP ${res.status}`,
      res.status,
      err
    );
  }
  return res.json();
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
  const result = await api<{ access_token?: string; verification_required?: boolean }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password, referral_code: referralCode, device_id: getOrCreateDeviceId() }),
  });
  return { access_token: result.access_token, verification_required: !!result.verification_required };
}

export async function login(email: string, password: string) {
  const result = await api<{ access_token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, device_id: getOrCreateDeviceId() }),
  });
  return { access_token: result.access_token };
}

export async function me(token: string) {
  return api<any>("/api/auth/me", { method: "GET", token });
}

export async function verifyEmail(email: string, code: string) {
  const result = await api<{ access_token: string }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code, device_id: getOrCreateDeviceId() }),
  });
  return { access_token: result.access_token };
}

export async function resendVerificationCode(email: string) {
  return api<{ status: string }>("/api/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email, device_id: getOrCreateDeviceId() }),
  });
}

export async function getDashboardStats(token: string) {
  return api<any>("/api/dashboard/stats", { method: "GET", token });
}

export async function getLiveStats() {
  return { total_searches: 0, active_users: 0 };
}

export async function getPricingPlans() {
  const data = await api<any>("/api/pricing/plans");
  return data.plans;
}

export async function subscribe(token: string, planId: string) {
  return api<any>("/api/pricing/subscribe", {
    method: "POST",
    token,
    body: JSON.stringify({ plan_id: planId }),
  });
}

export async function confirmPayment(token: string, paymentId: number) {
  return api<any>(`/api/pricing/confirm-payment/${paymentId}`, {
    method: "POST",
    token,
  });
}

export async function getCurrentSubscription(token: string) {
  return api<any>("/api/pricing/subscription", {
    method: "GET",
    token,
  });
}

export async function requestPasswordReset(email: string, locale: string) {
  const base =
    typeof window !== "undefined" ? `${window.location.origin}/${locale}/reset-password` : `/${locale}/reset-password`;
  return api<{ status: string }>("/api/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ email, device_id: getOrCreateDeviceId(), reset_url_base: base }),
  });
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  return api<{ status: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, token, new_password: newPassword, device_id: getOrCreateDeviceId() }),
  });
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  return api<{ status: string }>("/api/auth/change-password", {
    method: "POST",
    token,
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

export async function updateProfile(token: string, username: string) {
  return api<any>("/api/auth/profile", {
    method: "PATCH",
    token,
    body: JSON.stringify({ username }),
  });
}

export async function deleteAccount(token: string) {
  return api<{ status: string }>("/api/auth/account", {
    method: "DELETE",
    token,
  });
}
