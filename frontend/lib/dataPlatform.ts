import { api } from "@/lib/api";

export type DataSource = {
  id: number;
  owner_user_id: number;
  name: string;
  kind: "website" | "api";
  base_url: string;
  is_enabled: boolean;
  crawl_config: Record<string, unknown>;
  transform_config: Record<string, unknown>;
  classify_config: Record<string, unknown>;
  retention_config: Record<string, unknown>;
  last_crawl_started_at?: string | null;
  last_crawl_finished_at?: string | null;
  last_crawl_status?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type CrawlJob = {
  id: number;
  owner_user_id: number;
  source_id: number;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  message?: string | null;
  consent_received: boolean;
  policy_context: Record<string, unknown>;
  strategy_override: Record<string, unknown>;
  started_at?: string | null;
  finished_at?: string | null;
  discovered_count: number;
  fetched_count: number;
  stored_count: number;
  skipped_count: number;
  failed_count: number;
  created_at: string;
};

export type DocumentItem = {
  id: number;
  owner_user_id: number;
  source_id: number;
  job_id?: number | null;
  url: string;
  canonical_url?: string | null;
  title?: string | null;
  content_text: string;
  extracted: Record<string, unknown>;
  language?: string | null;
  category?: string | null;
  tags: string[];
  quality_score?: number | null;
  quality_flags: string[];
  pii_redacted: boolean;
  first_seen_at: string;
  last_seen_at: string;
};

export async function createSource(params: {
  token: string;
  name: string;
  kind: "website" | "api";
  base_url: string;
  crawl_config?: Record<string, unknown>;
  transform_config?: Record<string, unknown>;
  classify_config?: Record<string, unknown>;
  retention_config?: Record<string, unknown>;
}): Promise<DataSource> {
  return api.post<DataSource>("/api/data-platform/sources", {
    name: params.name,
    kind: params.kind,
    base_url: params.base_url,
    crawl_config: params.crawl_config || {},
    transform_config: params.transform_config || {},
    classify_config: params.classify_config || {},
    retention_config: params.retention_config || {},
  }, { token: params.token });
}

export async function listSources(token: string): Promise<DataSource[]> {
  return api.get<DataSource[]>("/api/data-platform/sources", { token });
}

export async function startJob(params: {
  token: string;
  source_id: number;
  consent: boolean;
  policy_context?: Record<string, unknown>;
  strategy_override?: Record<string, unknown>;
}): Promise<CrawlJob> {
  return api.post<CrawlJob>(`/api/data-platform/sources/${params.source_id}/jobs`, {
    consent: params.consent,
    policy_context: params.policy_context || {},
    strategy_override: params.strategy_override || {},
  }, { token: params.token });
}

export async function listJobs(token: string, source_id?: number): Promise<CrawlJob[]> {
  const params = source_id ? { source_id } : undefined;
  return api.get<CrawlJob[]>("/api/data-platform/jobs", { token, params });
}

export async function searchDocuments(params: {
  token: string;
  q?: string;
  source_id?: number;
  category?: string;
  tags?: string[];
  quality_min?: number;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; items: DocumentItem[] }> {
  const queryParams: Record<string, any> = {
    limit: params.limit ?? 25,
    offset: params.offset ?? 0,
  };
  if (params.q) queryParams.q = params.q;
  if (typeof params.source_id === "number") queryParams.source_id = params.source_id;
  if (params.category) queryParams.category = params.category;
  if (params.tags && params.tags.length) queryParams.tags = params.tags.join(',');
  if (typeof params.quality_min === "number") queryParams.quality_min = params.quality_min;
  
  return api.get<{ total: number; items: DocumentItem[] }>("/api/data-platform/documents", {
    token: params.token,
    params: queryParams
  });
}

export async function qualitySummary(token: string, source_id?: number): Promise<any> {
  const params = source_id ? { source_id } : undefined;
  return api.get<any>("/api/data-platform/quality/summary", { token, params });
}

