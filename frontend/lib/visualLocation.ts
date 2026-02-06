export type VisualLocationPrediction = {
  country: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type VisualMatch = {
  provider: string;
  source_url: string | null;
  image_url: string | null;
  title: string | null;
  similarity_percent: number;
  confidence_0_1: number;
  location_hint: VisualLocationPrediction | null;
};

export type LocationEvidence = {
  source: string;
  confidence_0_1: number;
  url: string | null;
};

export type ComplianceCheck = {
  consent_required: boolean;
  consent_received: boolean;
  images_stored: boolean;
  credits_consumed: number;
  providers_used: string[];
  trace_id?: string | null;
  ab_variant?: string | null;
};

export type VisualSimilarityLocationReport = {
  predicted_location: VisualLocationPrediction;
  confidence_0_1: number;
  matches: VisualMatch[];
  location_sources?: LocationEvidence[];
  compliance: ComplianceCheck;
  mandatory_notice: string;
};

export class VisualLocationAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "VisualLocationAPIError";
  }
}

function pickString(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
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

export async function analyzeVisualLocation(params: {
  token: string;
  file: File;
  consent: boolean;
}): Promise<VisualSimilarityLocationReport> {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/+$/, "");
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("consent", params.consent ? "true" : "false");
  formData.append("device_id", getOrCreateDeviceId());

  const res = await fetch(`${apiBase}/visual-location/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${params.token}` },
    body: formData,
  });

  if (!res.ok) {
    const err: unknown = await res.json().catch(() => ({ detail: res.statusText }));
    const message =
      pickString(err, "error") ||
      pickString(err, "detail") ||
      (typeof err === "string" ? err : undefined) ||
      `HTTP ${res.status}`;
    throw new VisualLocationAPIError(message, res.status, err);
  }

  return res.json();
}
