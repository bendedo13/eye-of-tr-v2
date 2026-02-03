/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

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

export async function register(email: string, username: string, password: string, referralCode?: string) {
  const result = await api<{ message: string; userId: string; access_token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name: username, password, referral_code: referralCode }),
  });
  return { access_token: result.access_token, user: { id: result.userId, email } };
}

export async function login(email: string, password: string) {
  const result = await api<{ message: string; access_token: string; user: any }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { access_token: result.access_token, user: result.user };
}

export async function me(token: string) {
  const result = await api<{ user: any }>("/api/auth/me", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  return result.user;
}

export async function getDashboardStats(userId: string | number, token: string) {
  return api<any>("/api/dashboard/stats", {
    method: "POST",
    token, // Pass token in header
    body: JSON.stringify({ userId }),
  });
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
