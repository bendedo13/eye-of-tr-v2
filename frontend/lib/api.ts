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
      err.detail || `HTTP ${res.status}`,
      res.status,
      err
    );
  }
  return res.json();
}

export async function register(email: string, password: string) {
  const url = `${API_BASE}/auth/register`;
  const body = { email, password };
  
  console.log('🔵 Register Request:', {
    url,
    method: 'POST',
    body: JSON.stringify(body, null, 2)
  });
  
  try {
    const result = await api<{ access_token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    console.log('✅ Register Success:', result);
    return result;
  } catch (error) {
    console.error('❌ Register Error:', error);
    throw error;
  }
}

export async function login(email: string, password: string) {
  const url = `${API_BASE}/auth/login`;
  const body = { email, password };
  
  console.log('🔵 Login Request:', {
    url,
    method: 'POST',
    body: JSON.stringify(body, null, 2)
  });
  
  try {
    const result = await api<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    console.log('✅ Login Success:', result);
    return result;
  } catch (error) {
    console.error('❌ Login Error:', error);
    throw error;
  }
}

export async function me(token: string) {
  return api<{ id: number; email: string }>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
