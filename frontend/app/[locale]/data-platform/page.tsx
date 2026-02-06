"use client";

import ClientOnly from "@/components/ClientOnly";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/context/AuthContext";
import {
  createSource,
  listJobs,
  listSources,
  searchDocuments,
  startJob,
  type CrawlJob,
  type DataSource
} from "@/lib/dataPlatform";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, use } from "react";

type JobEvent =
  | { type: "status"; payload: { status: string } }
  | { type: "progress"; payload: any }
  | { type: "summary"; payload: any }
  | { type: "error"; payload: { message: string } };

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/+$/, "");
}

async function streamSSE(params: {
  url: string;
  token: string;
  onEvent: (ev: JobEvent) => void;
  signal: AbortSignal;
}) {
  const res = await fetch(params.url, {
    method: "GET",
    headers: { Authorization: `Bearer ${params.token}` }
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (params.signal.aborted) break;
    buf += decoder.decode(value, { stream: true });
    while (true) {
      const idx = buf.indexOf("\n\n");
      if (idx === -1) break;
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const line = chunk
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("data:"));
      if (!line) continue;
      const jsonStr = line.replace(/^data:\s*/, "");
      if (!jsonStr || jsonStr === "{}") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed?.type) params.onEvent(parsed as JobEvent);
      } catch {
        continue;
      }
    }
  }
}

export default function DataPlatformPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();

  const [sources, setSources] = useState<DataSource[]>([]);
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [jobLog, setJobLog] = useState<string[]>([]);

  const [createName, setCreateName] = useState("");
  const [createKind, setCreateKind] = useState<"website" | "api">("website");
  const [createUrl, setCreateUrl] = useState("");
  const [createMaxPages, setCreateMaxPages] = useState(50);
  const [createMaxDepth, setCreateMaxDepth] = useState(1);

  const [docQuery, setDocQuery] = useState("");
  const [docItems, setDocItems] = useState<any[]>([]);
  const [docTotal, setDocTotal] = useState<number>(0);

  const abortRef = useRef<AbortController | null>(null);

  const sourceById = useMemo(() => {
    const map = new Map<number, DataSource>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [mounted, loading, user, router, locale]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const [src, j] = await Promise.all([listSources(token), listJobs(token)]);
      setSources(src);
      setJobs(j);
    };
    if (mounted && token) load();
  }, [mounted, token]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const refreshJobs = async () => {
    if (!token) return;
    const j = await listJobs(token);
    setJobs(j);
  };

  const runSearch = async () => {
    if (!token) return;
    const res = await searchDocuments({ token, q: docQuery, limit: 25, offset: 0 });
    setDocItems(res.items);
    setDocTotal(res.total);
  };

  const onCreate = async () => {
    if (!token) return;
    const src = await createSource({
      token,
      name: createName || "Yeni Kaynak",
      kind: createKind,
      base_url: createUrl,
      crawl_config:
        createKind === "website"
          ? { max_pages: createMaxPages, max_depth: createMaxDepth, start_urls: [createUrl] }
          : { max_pages: createMaxPages, endpoints: [""] },
      transform_config: { redact_pii: true, min_quality_score: 10 },
      retention_config: { max_documents_per_source: 20000 }
    });
    setSources([src, ...sources]);
    setCreateName("");
    setCreateUrl("");
  };

  const onStartJob = async (sourceId: number) => {
    if (!token) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setJobLog([]);
    const job = await startJob({
      token,
      source_id: sourceId,
      consent: true,
      policy_context: {
        purpose: "Açık kaynak/veri yönetimi",
        legal_basis: "Meşru menfaat / açık rıza"
      }
    });
    setActiveJobId(job.id);
    setJobs([job, ...jobs]);

    const url = `${apiBase()}/data-platform/jobs/${job.id}/events`;
    streamSSE({
      url,
      token,
      signal: abortRef.current.signal,
      onEvent: (ev) => {
        if (ev.type === "progress") {
          setJobLog((prev) => [
            ...prev.slice(-199),
            `progress: discovered=${ev.payload.discovered} stored=${ev.payload.stored} skipped=${ev.payload.skipped}`
          ]);
        } else if (ev.type === "status") {
          setJobLog((prev) => [...prev.slice(-199), `status: ${ev.payload.status}`]);
        } else if (ev.type === "summary") {
          setJobLog((prev) => [...prev.slice(-199), `summary: ${JSON.stringify(ev.payload)}`]);
          refreshJobs();
        } else if (ev.type === "error") {
          setJobLog((prev) => [...prev.slice(-199), `error: ${ev.payload.message}`]);
          refreshJobs();
        }
      }
    }).catch(async () => {
      await refreshJobs();
    });
  };

  if (!mounted || loading) return null;
  if (!user) return null;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-background text-slate-200">
        <Navbar />

        <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                Veri Toplama <span className="text-zinc-700">Platformu</span>
              </h1>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em]">
                Crawler · Temizleme · Etiketleme · Arama
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="h-12 px-6 text-[10px] font-black uppercase tracking-widest" onClick={() => router.push(`/${locale}/dashboard`)}>
                Dashboard
              </Button>
              <Button className="h-12 px-6 text-[10px] font-black uppercase tracking-widest" onClick={runSearch}>
                Doküman Ara
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <GlassCard className="p-8 lg:col-span-1">
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Yeni Kaynak</div>
              <div className="space-y-3">
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Kaynak adı"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white outline-none"
                />
                <select
                  value={createKind}
                  onChange={(e) => setCreateKind(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white outline-none"
                >
                  <option value="website">website</option>
                  <option value="api">api</option>
                </select>
                <input
                  value={createUrl}
                  onChange={(e) => setCreateUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={createMaxPages}
                    onChange={(e) => setCreateMaxPages(Number(e.target.value || 0))}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white outline-none"
                    min={1}
                    max={5000}
                  />
                  <input
                    type="number"
                    value={createMaxDepth}
                    onChange={(e) => setCreateMaxDepth(Number(e.target.value || 0))}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white outline-none"
                    min={0}
                    max={10}
                  />
                </div>
                <Button className="w-full h-12 text-[10px] font-black uppercase tracking-widest" onClick={onCreate} disabled={!createUrl.trim()}>
                  Kaynak Oluştur
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="p-8 lg:col-span-2">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Kaynaklar</div>
                  <div className="text-xs text-zinc-600 mt-1">{sources.length} kaynak</div>
                </div>
                <Button variant="outline" className="h-10 px-4 text-[10px] font-black uppercase tracking-widest" onClick={() => token && listSources(token).then(setSources)}>
                  Yenile
                </Button>
              </div>
              <div className="space-y-3">
                {sources.map((s) => (
                  <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/5 border border-white/5 rounded-2xl px-5 py-4">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white truncate">{s.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{s.kind} · {s.base_url}</div>
                      <div className="text-[10px] text-zinc-600 mt-1">last: {s.last_crawl_status || "—"}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="h-10 px-4 text-[10px] font-black uppercase tracking-widest" onClick={() => onStartJob(s.id)}>
                        Tara
                      </Button>
                    </div>
                  </div>
                ))}
                {!sources.length && (
                  <div className="text-zinc-500 text-sm">Henüz kaynak yok. Sol taraftan ekleyin.</div>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard className="p-8">
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">İşler</div>
              <div className="space-y-3">
                {jobs.slice(0, 25).map((j) => (
                  <div key={j.id} className="bg-white/5 border border-white/5 rounded-2xl px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-black text-white">#{j.id} · {sourceById.get(j.source_id)?.name || `source:${j.source_id}`}</div>
                      <div className="text-[10px] font-black tracking-widest uppercase text-zinc-500">{j.status}</div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-2">
                      stored {j.stored_count} · skipped {j.skipped_count} · failed {j.failed_count}
                    </div>
                  </div>
                ))}
                {!jobs.length && <div className="text-zinc-500 text-sm">Henüz iş yok.</div>}
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">
                Canlı Log {activeJobId ? `(job #${activeJobId})` : ""}
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 h-72 overflow-auto text-xs text-zinc-300 font-mono space-y-1">
                {jobLog.map((l, idx) => (
                  <div key={idx}>{l}</div>
                ))}
                {!jobLog.length && <div className="text-zinc-600">Job başlatınca burada akacak.</div>}
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
              <div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Dokümanlar</div>
                <div className="text-xs text-zinc-600 mt-1">{docTotal} kayıt</div>
              </div>
              <div className="flex gap-3">
                <input
                  value={docQuery}
                  onChange={(e) => setDocQuery(e.target.value)}
                  placeholder="Arama terimi"
                  className="w-80 max-w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white outline-none"
                />
                <Button className="h-12 px-6 text-[10px] font-black uppercase tracking-widest" onClick={runSearch}>
                  Ara
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {docItems.map((d: any) => (
                <div key={d.id} className="bg-white/5 border border-white/5 rounded-2xl px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white truncate">{d.title || d.url}</div>
                      <div className="text-xs text-zinc-500 truncate">{d.url}</div>
                    </div>
                    <div className="text-[10px] font-black tracking-widest uppercase text-zinc-500">
                      {d.category || "—"} · {d.language || "—"} · {typeof d.quality_score === "number" ? d.quality_score.toFixed(0) : "—"}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-2 line-clamp-2">{d.content_text}</div>
                  <div className="text-[10px] text-zinc-600 mt-2">{(d.tags || []).slice(0, 8).join(" · ")}</div>
                </div>
              ))}
              {!docItems.length && <div className="text-zinc-500 text-sm">Henüz arama yapılmadı.</div>}
            </div>
          </GlassCard>
        </div>
      </div>
    </ClientOnly>
  );
}

