/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class AdminAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "AdminAPIError";
  }
}

async function adminFetch<T>(path: string, options: RequestInit & { adminKey: string } ): Promise<T> {
  const { adminKey, ...init } = options;
  const headers: HeadersInit = {
    ...(init.headers as Record<string, string>),
    ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    "x-admin-key": adminKey,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new AdminAPIError(err.error || err.detail || `HTTP ${res.status}`, res.status, err);
  }
  return res.json();
}

export function adminPing(adminKey: string) {
  return adminFetch<{ status: string }>("/api/admin/ping", { method: "GET", adminKey });
}

export function adminOverview(adminKey: string) {
  return adminFetch<any>("/api/admin/overview", { method: "GET", adminKey });
}

export function adminListUsers(adminKey: string, params: { q?: string; status?: string; offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.status) usp.set("status_filter", params.status);
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/api/admin/users${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminUpdateUser(adminKey: string, userId: number, patch: any) {
  return adminFetch<{ status: string }>(`/api/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify(patch), adminKey });
}

export function adminListPayments(adminKey: string, params: { status?: string; offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.status) usp.set("status_filter", params.status);
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/api/admin/payments${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminListReferrals(adminKey: string, params: { offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/api/admin/referrals${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminGetSiteSettings(adminKey: string) {
  return adminFetch<{ settings: any }>("/api/admin/site-settings", { method: "GET", adminKey });
}

export function adminSetSiteSetting(adminKey: string, key: string, value: any) {
  return adminFetch<{ status: string }>("/api/admin/site-settings", { method: "POST", body: JSON.stringify({ key, value }), adminKey });
}

export function adminListBlogPosts(adminKey: string, params: { locale?: string } = {}) {
  const usp = new URLSearchParams();
  if (params.locale) usp.set("locale", params.locale);
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/api/admin/blog-posts${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminGetBlogPost(adminKey: string, id: number) {
  return adminFetch<{ post: any }>(`/api/admin/blog-posts/${id}`, { method: "GET", adminKey });
}

export function adminCreateBlogPost(adminKey: string, payload: any) {
  return adminFetch<{ id: number }>("/api/admin/blog-posts", { method: "POST", body: JSON.stringify(payload), adminKey });
}

export function adminUpdateBlogPost(adminKey: string, id: number, payload: any) {
  return adminFetch<{ status: string }>(`/api/admin/blog-posts/${id}`, { method: "PUT", body: JSON.stringify(payload), adminKey });
}

export function adminDeleteBlogPost(adminKey: string, id: number) {
  return adminFetch<{ status: string }>(`/api/admin/blog-posts/${id}`, { method: "DELETE", adminKey });
}

export function adminUploadMedia(adminKey: string, file: File, folder = "admin") {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  return adminFetch<{ id: number; url: string; filename: string }>("/api/admin/media/upload", {
    method: "POST",
    body: form,
    adminKey,
  });
}

export function adminListMedia(adminKey: string, params: { offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/api/admin/media${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

