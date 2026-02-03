export type LocationPrediction = {
  country: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type LocationIntelligenceResult = {
  predicted_location: LocationPrediction;
  analysis: string;
  confidence: number;
  factors: string[];
  mandatory_notice: string;
};

export class LocationIntelligenceAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "LocationIntelligenceAPIError";
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

export async function analyzeLocationIntelligence(params: {
  token: string;
  file: File;
  consent: boolean;
}): Promise<LocationIntelligenceResult> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("consent", params.consent ? "true" : "false");
  formData.append("device_id", getOrCreateDeviceId());

  const res = await fetch(`${apiBase}/api/location-intelligence/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${params.token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new LocationIntelligenceAPIError(
      (err as any)?.error || (err as any)?.detail || `HTTP ${res.status}`,
      res.status,
      err
    );
  }

  return res.json();
}

