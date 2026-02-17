export type LocationSearchPreview = {
  country: string | null;
  city_hint: string | null;
  latitude_hint: string | null;
  longitude_hint: string | null;
  confidence: number;
  data_points_found: number;
  camera_model: string | null;
  timestamp_found: boolean;
  altitude_found: boolean;
  direction_found: boolean;
  message?: string;
  suggestion?: string;
  timestamp?: string | null;
};

export type LocationSearchFullResult = {
  latitude: number;
  longitude: number;
  country: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  confidence: number;
  maps_url: string;
  camera_model: string | null;
  timestamp: string | null;
  altitude: number | null;
  direction: number | null;
  data_points_found: number;
};

export type LocationSearchResponse = {
  status: string;
  is_preview: boolean;
  exif_found: boolean;
  gps_found: boolean;
  preview?: LocationSearchPreview;
  result?: LocationSearchFullResult;
  teaser_message?: string;
  unlock_cta?: string;
  remaining_credits: {
    location_search: number;
    regular: number | string;
  };
  mandatory_notice: string;
};

export class LocationSearchAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "LocationSearchAPIError";
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

export async function analyzeLocationSearch(params: {
  token: string;
  file: File;
  consent: boolean;
}): Promise<LocationSearchResponse> {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/+$/, "");
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("consent", params.consent ? "true" : "false");
  formData.append("device_id", getOrCreateDeviceId());

  const res = await fetch(`${apiBase}/location-search/analyze`, {
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
    throw new LocationSearchAPIError(message, res.status, err);
  }

  return res.json();
}
