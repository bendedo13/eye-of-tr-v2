/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

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

async function adminFetch<T>(path: string, options: RequestInit & { adminKey: string }): Promise<T> {
  const { adminKey, ...init } = options;
  const adminEmail =
    typeof window !== "undefined"
      ? (() => {
          try {
            const raw = window.localStorage.getItem("admin");
            if (!raw) return undefined;
            const parsed = JSON.parse(raw);
            const email = typeof parsed?.email === "string" ? parsed.email.trim() : "";
            return email || undefined;
          } catch {
            return undefined;
          }
        })()
      : undefined;
  const headers: HeadersInit = {
    ...(init.headers as Record<string, string>),
    ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    "x-admin-key": adminKey,
    ...(adminEmail ? { "x-admin-email": adminEmail } : {}),
  };

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const base = (API_BASE || "").replace(/\/+$/, "");
  let normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    normalizedPath = normalizedPath.slice(4);
  }
  const url = `${base}${normalizedPath}`;

  try {
    const res = await fetch(url, { 
      ...init, 
      headers,
      signal: controller.signal 
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new AdminAPIError(err.error || err.detail || `HTTP ${res.status}`, res.status, err);
    }
    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new AdminAPIError("Sunucu yanıt vermiyor (Timeout). Lütfen bağlantınızı kontrol edin.", 408);
    }
    if (error instanceof AdminAPIError) throw error;
    throw new AdminAPIError(error.message || "Bağlantı hatası", 0);
  }
}

export function adminPing(adminKey: string) {
  return adminFetch<{ status: string }>("/admin/ping", { method: "GET", adminKey });
}

export function adminOverview(adminKey: string) {
  return adminFetch<any>("/admin/overview", { method: "GET", adminKey });
}

export function adminListUsers(adminKey: string, params: { q?: string; status?: string; offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.status) usp.set("status_filter", params.status);
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/admin/users${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminUpdateUser(adminKey: string, userId: number, patch: any) {
  return adminFetch<{ status: string }>(`/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify(patch), adminKey });
}

export function adminListPayments(adminKey: string, params: { status?: string; offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.status) usp.set("status_filter", params.status);
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/admin/payments${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminListReferrals(adminKey: string, params: { offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/admin/referrals${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminGetSiteSettings(adminKey: string) {
  return adminFetch<{ settings: any }>("/admin/site-settings", { method: "GET", adminKey });
}

export function adminSetSiteSetting(adminKey: string, key: string, value: any) {
  return adminFetch<{ status: string }>("/admin/site-settings", { method: "POST", body: JSON.stringify({ key, value }), adminKey });
}

export function adminListBlogPosts(adminKey: string, params: { locale?: string } = {}) {
  const usp = new URLSearchParams();
  if (params.locale) usp.set("locale", params.locale);
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/admin/blog-posts${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminGetBlogPost(adminKey: string, id: number) {
  return adminFetch<{ post: any }>(`/admin/blog-posts/${id}`, { method: "GET", adminKey });
}

export function adminCreateBlogPost(adminKey: string, payload: any) {
  return adminFetch<{ id: number }>("/admin/blog-posts", { method: "POST", body: JSON.stringify(payload), adminKey });
}

export function adminUpdateBlogPost(adminKey: string, id: number, payload: any) {
  return adminFetch<{ status: string }>(`/admin/blog-posts/${id}`, { method: "PUT", body: JSON.stringify(payload), adminKey });
}

export function adminDeleteBlogPost(adminKey: string, id: number) {
  return adminFetch<{ status: string }>(`/admin/blog-posts/${id}`, { method: "DELETE", adminKey });
}

export function adminUploadMedia(adminKey: string, file: File, folder = "admin") {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  return adminFetch<{ id: number; url: string; filename: string }>("/admin/media/upload", {
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
  return adminFetch<{ items: any[] }>(`/admin/media${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminListNotifications(adminKey: string, params: { offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/admin/notifications${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminCreateNotification(adminKey: string, payload: any) {
  return adminFetch<{ id: number; status: string }>("/admin/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
    adminKey,
  });
}

export function adminStartScraping(adminKey: string, url: string) {
  return adminFetch<any>("/admin/scraping/start", {
    method: "POST",
    body: JSON.stringify({ url }),
    adminKey,
  });
}

export function adminChangePassword(adminKey: string, newPassword: string) {
  return adminFetch<any>("/admin/change-password", {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword }),
    adminKey,
  });
}

export function adminListAudit(adminKey: string, params: { q?: string; action?: string; offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.action) usp.set("action", params.action);
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/admin/audit${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminSendEmail(adminKey: string, payload: any) {
  return adminFetch<{ status: string }>("/admin/emails/send", {
    method: "POST",
    body: JSON.stringify(payload),
    adminKey,
  });
}

export function adminListEmailLogs(adminKey: string, params: { offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/admin/emails/logs${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminCreateEmailTemplate(adminKey: string, payload: any) {
  return adminFetch<any>("/admin/emails/templates", {
    method: "POST",
    body: JSON.stringify(payload),
    adminKey,
  });
}

export function adminListEmailTemplates(adminKey: string) {
  return adminFetch<any[]>("/admin/emails/templates", { method: "GET", adminKey });
}

// Support System API Functions
export function adminListTickets(adminKey: string, params: { status?: string; priority?: string; offset?: number; limit?: number } = {}) {
  const usp = new URLSearchParams();
  if (params.status) usp.set("status", params.status);
  if (params.priority) usp.set("priority", params.priority);
  if (params.offset != null) usp.set("offset", String(params.offset));
  if (params.limit != null) usp.set("limit", String(params.limit));
  const qs = usp.toString();
  return adminFetch<{ items: any[] }>(`/admin/support/tickets${qs ? `?${qs}` : ""}`, { method: "GET", adminKey });
}

export function adminGetTicketDetails(adminKey: string, ticketId: number) {
  return adminFetch<{ ticket: any; messages: any[] }>(`/admin/support/tickets/${ticketId}`, { method: "GET", adminKey });
}

export function adminReplyToTicket(adminKey: string, ticketId: number, payload: { content: string; status?: string }) {
  return adminFetch<{ status: string; message_id: number }>(`/admin/support/tickets/${ticketId}/reply`, {
    method: "POST",
    body: JSON.stringify(payload),
    adminKey,
  });
}

export function adminUpdateTicketStatus(adminKey: string, ticketId: number, status: string) {
  return adminFetch<{ status: string }>(`/admin/support/tickets/${ticketId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
    adminKey,
  });
}
