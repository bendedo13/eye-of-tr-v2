"use client";

import { useEffect, useState } from "react";

export type SiteConfig = Record<string, any>;

const cache = new Map<string, SiteConfig>();
const inflight = new Map<string, Promise<SiteConfig>>();

async function fetchSiteConfig(locale: string): Promise<SiteConfig> {
  if (cache.has(locale)) return cache.get(locale)!;
  if (inflight.has(locale)) return inflight.get(locale)!;

  const request = fetch(`/api/public/site-config?locale=${encodeURIComponent(locale)}`)
    .then(async (res) => {
      if (!res.ok) {
        console.error(`[siteConfig] Fetch failed: ${res.status} ${res.statusText}`);
        throw new Error(`Site config fetch failed: ${res.status}`);
      }
      const data = await res.json();
      const config = (data?.config || {}) as SiteConfig;
      cache.set(locale, config);
      return config;
    })
    .catch((error) => {
      console.error("[siteConfig] Error fetching site config:", error);
      return {} as SiteConfig;
    })
    .finally(() => {
      inflight.delete(locale);
    });

  inflight.set(locale, request);
  return request;
}

export function useSiteConfig(locale: string) {
  const [config, setConfig] = useState<SiteConfig | null>(() => cache.get(locale) ?? null);
  const [loading, setLoading] = useState(!cache.has(locale));

  useEffect(() => {
    let active = true;
    setLoading(!cache.has(locale));
    fetchSiteConfig(locale)
      .then((cfg) => {
        if (!active) return;
        setConfig(cfg);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  return { config, loading };
}
