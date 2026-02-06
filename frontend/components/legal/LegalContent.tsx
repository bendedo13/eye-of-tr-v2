"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Calendar, ShieldCheck } from "lucide-react";

type LegalPage = {
  title?: string;
  subtitle?: string;
  content_html?: string;
  updated_at?: string;
};

function resolveHtmlMedia(html: string) {
  return html
    .replace(/src=(["'])https?:\/\/[^"']+\/uploads\//g, "src=$1/api/uploads/")
    .replace(/href=(["'])https?:\/\/[^"']+\/uploads\//g, "href=$1/api/uploads/")
    .replace(/src=(["'])\/uploads\//g, "src=$1/api/uploads/")
    .replace(/href=(["'])\/uploads\//g, "href=$1/api/uploads/");
}

export default function LegalContent({
  locale,
  slug,
  fallbackTitle,
  fallbackSubtitle,
  fallbackContent,
}: {
  locale: string;
  slug: string;
  fallbackTitle: string;
  fallbackSubtitle?: string;
  fallbackContent: React.ReactNode;
}) {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/legal-pages/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setPage(d.page || null))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [locale, slug]);

  const title = page?.title || fallbackTitle;
  const subtitle = page?.subtitle || fallbackSubtitle;
  const html = page?.content_html ? resolveHtmlMedia(page.content_html) : "";

  const updatedText = useMemo(() => {
    if (!page?.updated_at) return null;
    const date = new Date(page.updated_at);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US");
  }, [page?.updated_at, locale]);

  return (
    <div className="space-y-10">
      <GlassCard className="p-8 md:p-10 border-white/10" hasScanline>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <ShieldCheck size={12} /> FaceSeek
          </span>
          {updatedText ? (
            <span className="inline-flex items-center gap-2 text-zinc-500">
              <Calendar size={12} /> {updatedText}
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">{title}</h1>
        {subtitle ? <p className="text-zinc-500 mt-4 text-sm md:text-base">{subtitle}</p> : null}
      </GlassCard>

      {loading ? (
        <div className="text-zinc-500 text-sm">{locale === "tr" ? "Yükleniyor..." : "Loading..."}</div>
      ) : html ? (
        <div className="prose prose-invert prose-p:text-zinc-400 prose-headings:text-white max-w-none">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      ) : (
        fallbackContent
      )}
    </div>
  );
}
