"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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

function inferLocaleFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const maybe = parts[0];
  return maybe === "tr" || maybe === "en" ? maybe : "en";
}

export default function AnalyticsHeartbeat() {
  const pathname = usePathname() || "/";
  const { token } = useAuth();

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const deviceId = getOrCreateDeviceId();
    const locale = inferLocaleFromPath(pathname);

    let stopped = false;
    let timer: any = null;

    const tick = async () => {
      if (stopped) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        await fetch(`${apiBase}/api/analytics/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ device_id: deviceId, seconds: 15, path: pathname, locale }),
        });
      } catch {
      }
    };

    tick();
    timer = setInterval(tick, 15000);

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [pathname, token]);

  return null;
}

