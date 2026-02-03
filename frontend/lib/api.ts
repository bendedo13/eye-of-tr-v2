const API_BASE = "";

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
    body: JSON.stringify({ userId: token }),
  });
  return result.user;
}

export async function getDashboardStats(token: string) {
  return api<any>("/api/dashboard/stats", {
    method: "POST",
    body: JSON.stringify({ userId: token }),
  });
}

export async function getLiveStats() {
  return { total_searches: 0, active_users: 0 };
}

export async function getPricingPlans() {
  return [
    { id: "free", name: "Ücretsiz", price: 0, credits: 10 },
    { id: "basic", name: "Basic", price: 29, credits: 100 },
    { id: "pro", name: "Pro", price: 79, credits: 500 },
  ];
}

export async function subscribe(token: string, planId: string, paymentMethod: string = "credit_card") {
  return { success: true, planId };
}

export async function confirmPayment(token: string, paymentId: number) {
  return { success: true };
}

export async function getCurrentSubscription(token: string) {
  return { plan: "free", credits: 10 };
}