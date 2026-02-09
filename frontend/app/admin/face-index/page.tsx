"use client";

import { useEffect, useState, useCallback } from "react";
import {
  adminFaceIndexStatus,
  adminFaceIndexListSources,
  adminFaceIndexCreateSource,
  adminFaceIndexUpdateSource,
  adminFaceIndexDeleteSource,
  adminFaceIndexTriggerCrawl,
  adminFaceIndexListJobs,
  adminFaceIndexCancelJob,
  adminFaceIndexGetConfig,
  adminFaceIndexReindex,
  adminFaceIndexListProxies,
  adminFaceIndexCreateProxy,
  adminFaceIndexDeleteProxy,
  adminFaceIndexTestProxies,
  adminFaceIndexImportProxies,
} from "@/lib/adminApi";

type Tab = "overview" | "sources" | "jobs" | "proxies" | "config";

interface ProxyData {
  id: number;
  proxy_url: string;
  proxy_type: string;
  country: string | null;
  label: string | null;
  is_active: boolean;
  last_check_at: string | null;
  last_check_ok: boolean | null;
  success_count: number;
  fail_count: number;
  avg_response_ms: number | null;
  created_at: string;
}

interface StatusData {
  total_faces: number;
  total_images: number;
  total_sources: number;
  active_sources: number;
  running_jobs: number;
  index_size_mb: number;
  embedding_model: string;
  embedding_version: number;
}

interface Source {
  id: number;
  name: string;
  kind: string;
  base_url: string;
  is_enabled: boolean;
  rate_limit_rpm: number;
  rate_limit_concurrent: number;
  schedule_cron: string | null;
  schedule_enabled: boolean;
  total_images_found: number;
  total_faces_indexed: number;
  last_crawl_at: string | null;
  last_crawl_status: string | null;
  created_at: string;
}

interface Job {
  id: number;
  source_id: number;
  status: string;
  message: string | null;
  pages_crawled: number;
  images_found: number;
  images_downloaded: number;
  faces_detected: number;
  faces_indexed: number;
  images_skipped: number;
  errors_count: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

interface ConfigData {
  similarity_threshold: number;
  top_k_default: number;
  min_face_det_score: number;
  crawler_default_rpm: number;
  crawler_concurrent: number;
  max_faces_per_image: number;
}

function getAdminKey(): string {
  return typeof window !== "undefined" ? localStorage.getItem("adminKey") || "" : "";
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    succeeded: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    queued: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[status] || colors.cancelled}`}>
      {status}
    </span>
  );
}

export default function FaceIndexPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [proxies, setProxies] = useState<ProxyData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Proxy form
  const [showNewProxy, setShowNewProxy] = useState(false);
  const [showImportProxy, setShowImportProxy] = useState(false);
  const [newProxy, setNewProxy] = useState({ proxy_url: "", proxy_type: "http", country: "", label: "" });
  const [importText, setImportText] = useState("");
  const [importType, setImportType] = useState("http");

  // New source form
  const [showNewSource, setShowNewSource] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    kind: "website",
    base_url: "",
    is_enabled: true,
    rate_limit_rpm: 30,
    rate_limit_concurrent: 2,
    schedule_cron: "",
    schedule_enabled: false,
    crawl_config_json: '{"max_pages": 50, "depth": 2}',
  });

  const fetchAll = useCallback(async () => {
    const key = getAdminKey();
    if (!key) return;
    try {
      const [st, src, jb, cfg, prx] = await Promise.all([
        adminFaceIndexStatus(key),
        adminFaceIndexListSources(key),
        adminFaceIndexListJobs(key, { limit: 50 }),
        adminFaceIndexGetConfig(key),
        adminFaceIndexListProxies(key),
      ]);
      setStatusData(st);
      setSources(src || []);
      setJobs(jb || []);
      setConfig(cfg);
      setProxies(prx || []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleCreateSource = async () => {
    setActionLoading("create");
    try {
      await adminFaceIndexCreateSource(getAdminKey(), newSource);
      setShowNewSource(false);
      setNewSource({ name: "", kind: "website", base_url: "", is_enabled: true, rate_limit_rpm: 30, rate_limit_concurrent: 2, schedule_cron: "", schedule_enabled: false, crawl_config_json: '{"max_pages": 50, "depth": 2}' });
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSource = async (id: number) => {
    if (!confirm("Bu kaynagi silmek istediginize emin misiniz? Tum iliskili veriler silinecek.")) return;
    setActionLoading(`del-${id}`);
    try {
      await adminFaceIndexDeleteSource(getAdminKey(), id);
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSource = async (src: Source) => {
    setActionLoading(`toggle-${src.id}`);
    try {
      await adminFaceIndexUpdateSource(getAdminKey(), src.id, { is_enabled: !src.is_enabled });
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerCrawl = async (sourceId: number) => {
    setActionLoading(`crawl-${sourceId}`);
    try {
      await adminFaceIndexTriggerCrawl(getAdminKey(), sourceId);
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelJob = async (jobId: number) => {
    setActionLoading(`cancel-${jobId}`);
    try {
      await adminFaceIndexCancelJob(getAdminKey(), jobId);
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReindex = async () => {
    if (!confirm("FAISS index sifirlanacak. Devam etmek istiyor musunuz?")) return;
    setActionLoading("reindex");
    try {
      await adminFaceIndexReindex(getAdminKey());
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateProxy = async () => {
    setActionLoading("create-proxy");
    try {
      await adminFaceIndexCreateProxy(getAdminKey(), {
        proxy_url: newProxy.proxy_url,
        proxy_type: newProxy.proxy_type,
        country: newProxy.country || null,
        label: newProxy.label || null,
      });
      setShowNewProxy(false);
      setNewProxy({ proxy_url: "", proxy_type: "http", country: "", label: "" });
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProxy = async (id: number) => {
    setActionLoading(`del-proxy-${id}`);
    try {
      await adminFaceIndexDeleteProxy(getAdminKey(), id);
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestProxies = async () => {
    setActionLoading("test-proxies");
    try {
      const result = await adminFaceIndexTestProxies(getAdminKey());
      alert(`Test tamamlandi: ${result.ok} basarili, ${result.failed} basarisiz`);
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleImportProxies = async () => {
    if (!importText.trim()) return;
    setActionLoading("import-proxies");
    try {
      const result = await adminFaceIndexImportProxies(getAdminKey(), { proxies: importText, proxy_type: importType });
      alert(`Import: ${result.added} eklendi, ${result.skipped} atlandı`);
      setShowImportProxy(false);
      setImportText("");
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "GENEL BAKIS" },
    { key: "sources", label: "KAYNAKLAR" },
    { key: "jobs", label: "ISLER" },
    { key: "proxies", label: "PROXY'LER" },
    { key: "config", label: "KONFIGURASYON" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">FACE INDEX</h1>
          <p className="text-zinc-500 text-sm mt-1">Self-hosted yuz veritabani yonetimi</p>
        </div>
        <button
          onClick={fetchAll}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all"
        >
          YENILE
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-300 hover:text-white">X</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all ${
              tab === t.key
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && statusData && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Toplam Yuz", value: statusData.total_faces.toLocaleString(), color: "text-primary" },
              { label: "Toplam Gorsel", value: statusData.total_images.toLocaleString(), color: "text-blue-400" },
              { label: "Aktif Kaynak", value: `${statusData.active_sources}/${statusData.total_sources}`, color: "text-emerald-400" },
              { label: "Calisan Is", value: statusData.running_jobs.toString(), color: "text-yellow-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-black/40 border border-white/5 rounded-2xl p-5">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">{stat.label}</div>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Index Info */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">INDEX DETAY</div>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-zinc-500">Index Boyutu:</span>
                <span className="text-white font-bold ml-2">{statusData.index_size_mb} MB</span>
              </div>
              <div>
                <span className="text-zinc-500">Model:</span>
                <span className="text-white font-bold ml-2">{statusData.embedding_model}</span>
              </div>
              <div>
                <span className="text-zinc-500">Versiyon:</span>
                <span className="text-white font-bold ml-2">v{statusData.embedding_version}</span>
              </div>
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">SON ISLER</div>
            {jobs.length === 0 ? (
              <p className="text-zinc-600 text-sm">Henuz is yok</p>
            ) : (
              <div className="space-y-2">
                {jobs.slice(0, 5).map((j) => (
                  <div key={j.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 text-xs">#{j.id}</span>
                      <StatusBadge status={j.status} />
                      <span className="text-zinc-400 text-xs">
                        {j.pages_crawled} sayfa / {j.images_downloaded} gorsel / {j.faces_indexed} yuz
                      </span>
                    </div>
                    <span className="text-zinc-600 text-[10px]">
                      {j.created_at ? new Date(j.created_at).toLocaleString("tr-TR") : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "sources" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewSource(!showNewSource)}
              className="px-5 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-xl text-xs font-black tracking-wider transition-all"
            >
              {showNewSource ? "IPTAL" : "+ KAYNAK EKLE"}
            </button>
          </div>

          {/* New Source Form */}
          {showNewSource && (
            <div className="bg-black/40 border border-primary/30 rounded-2xl p-6 space-y-4">
              <div className="text-[9px] font-black text-primary uppercase tracking-widest">YENI KAYNAK</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Ad</label>
                  <input
                    type="text"
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                    placeholder="Unsplash Faces"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Tur</label>
                  <select
                    value={newSource.kind}
                    onChange={(e) => setNewSource({ ...newSource, kind: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                  >
                    <option value="website">Website</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="facebook">Facebook</option>
                    <option value="open_dataset">Open Dataset</option>
                    <option value="news">News</option>
                    <option value="archive">Archive</option>
                    <option value="upload">Upload</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Base URL</label>
                  <input
                    type="text"
                    value={newSource.base_url}
                    onChange={(e) => setNewSource({ ...newSource, base_url: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                    placeholder="https://example.com/photos"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Rate Limit (RPM)</label>
                  <input
                    type="number"
                    value={newSource.rate_limit_rpm}
                    onChange={(e) => setNewSource({ ...newSource, rate_limit_rpm: parseInt(e.target.value) || 30 })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Concurrent</label>
                  <input
                    type="number"
                    value={newSource.rate_limit_concurrent}
                    onChange={(e) => setNewSource({ ...newSource, rate_limit_concurrent: parseInt(e.target.value) || 2 })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Crawl Config (JSON)</label>
                  <input
                    type="text"
                    value={newSource.crawl_config_json}
                    onChange={(e) => setNewSource({ ...newSource, crawl_config_json: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Cron Schedule</label>
                  <input
                    type="text"
                    value={newSource.schedule_cron}
                    onChange={(e) => setNewSource({ ...newSource, schedule_cron: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 font-mono"
                    placeholder="0 2 * * *"
                  />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSource.schedule_enabled}
                      onChange={(e) => setNewSource({ ...newSource, schedule_enabled: e.target.checked })}
                      className="rounded"
                    />
                    Schedule Aktif
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCreateSource}
                  disabled={!newSource.name || !newSource.base_url || actionLoading === "create"}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-xl text-xs font-black tracking-wider transition-all"
                >
                  {actionLoading === "create" ? "KAYDEDILIYOR..." : "KAYNAK OLUSTUR"}
                </button>
              </div>
            </div>
          )}

          {/* Sources Table */}
          {sources.length === 0 ? (
            <div className="bg-black/40 border border-white/5 rounded-2xl p-12 text-center">
              <p className="text-zinc-600">Henuz kaynak eklenmemis</p>
            </div>
          ) : (
            <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">AD</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">TUR</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">DURUM</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">GORSEL</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">YUZ</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">SON CRAWL</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">ISLEM</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((src) => (
                    <tr key={src.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-white">{src.name}</div>
                        <div className="text-[10px] text-zinc-600 truncate max-w-[200px]">{src.base_url}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{src.kind}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`w-2 h-2 rounded-full inline-block mr-2 ${src.is_enabled ? "bg-emerald-500" : "bg-zinc-600"}`}></span>
                        <span className="text-xs text-zinc-400">{src.is_enabled ? "Aktif" : "Pasif"}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-300 font-bold">{src.total_images_found}</td>
                      <td className="px-4 py-3 text-right text-sm text-primary font-bold">{src.total_faces_indexed}</td>
                      <td className="px-4 py-3">
                        {src.last_crawl_at ? (
                          <div>
                            <StatusBadge status={src.last_crawl_status || "unknown"} />
                            <div className="text-[10px] text-zinc-600 mt-1">
                              {new Date(src.last_crawl_at).toLocaleString("tr-TR")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleTriggerCrawl(src.id)}
                            disabled={actionLoading === `crawl-${src.id}`}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                          >
                            CRAWL
                          </button>
                          <button
                            onClick={() => handleToggleSource(src)}
                            disabled={actionLoading === `toggle-${src.id}`}
                            className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                          >
                            {src.is_enabled ? "DEVRE DISI" : "AKTIF ET"}
                          </button>
                          <button
                            onClick={() => handleDeleteSource(src.id)}
                            disabled={actionLoading === `del-${src.id}`}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                          >
                            SIL
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "jobs" && (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="bg-black/40 border border-white/5 rounded-2xl p-12 text-center">
              <p className="text-zinc-600">Henuz is yok</p>
            </div>
          ) : (
            <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">ID</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">KAYNAK</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">DURUM</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">SAYFA</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">GORSEL</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">YUZ</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">HATA</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">TARIH</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">ISLEM</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => {
                    const srcName = sources.find((s) => s.id === j.source_id)?.name || `#${j.source_id}`;
                    return (
                      <tr key={j.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-xs text-zinc-500">#{j.id}</td>
                        <td className="px-4 py-3 text-xs text-white font-bold">{srcName}</td>
                        <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                        <td className="px-4 py-3 text-right text-xs text-zinc-300">{j.pages_crawled}</td>
                        <td className="px-4 py-3 text-right text-xs text-zinc-300">
                          {j.images_downloaded}/{j.images_found}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-primary font-bold">{j.faces_indexed}</td>
                        <td className="px-4 py-3 text-right text-xs text-red-400">{j.errors_count > 0 ? j.errors_count : "-"}</td>
                        <td className="px-4 py-3 text-[10px] text-zinc-600">
                          {j.created_at ? new Date(j.created_at).toLocaleString("tr-TR") : ""}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(j.status === "queued" || j.status === "running") && (
                            <button
                              onClick={() => handleCancelJob(j.id)}
                              disabled={actionLoading === `cancel-${j.id}`}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                              IPTAL
                            </button>
                          )}
                          {j.message && (
                            <span className="text-[10px] text-zinc-600 ml-2" title={j.message}>
                              {j.message.slice(0, 30)}...
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "proxies" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleTestProxies}
              disabled={actionLoading === "test-proxies" || proxies.length === 0}
              className="px-5 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-xs font-black tracking-wider transition-all disabled:opacity-50"
            >
              {actionLoading === "test-proxies" ? "TEST EDILIYOR..." : "TUMUNU TEST ET"}
            </button>
            <button
              onClick={() => { setShowImportProxy(!showImportProxy); setShowNewProxy(false); }}
              className="px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-black tracking-wider transition-all"
            >
              {showImportProxy ? "IPTAL" : "TOPLU YUKLE"}
            </button>
            <button
              onClick={() => { setShowNewProxy(!showNewProxy); setShowImportProxy(false); }}
              className="px-5 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-xl text-xs font-black tracking-wider transition-all"
            >
              {showNewProxy ? "IPTAL" : "+ PROXY EKLE"}
            </button>
          </div>

          {/* Import Form */}
          {showImportProxy && (
            <div className="bg-black/40 border border-blue-500/30 rounded-2xl p-6 space-y-4">
              <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">TOPLU PROXY YUKLE</div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={6}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono"
                    placeholder={"http://user:pass@host:port\nsocks5://host:port\nhttp://host:port"}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Tur</label>
                    <select
                      value={importType}
                      onChange={(e) => setImportType(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="http">HTTP</option>
                      <option value="https">HTTPS</option>
                      <option value="socks5">SOCKS5</option>
                    </select>
                  </div>
                  <button
                    onClick={handleImportProxies}
                    disabled={!importText.trim() || actionLoading === "import-proxies"}
                    className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-black tracking-wider transition-all"
                  >
                    {actionLoading === "import-proxies" ? "YUKLENIYOR..." : "YUKLE"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Proxy Form */}
          {showNewProxy && (
            <div className="bg-black/40 border border-primary/30 rounded-2xl p-6 space-y-4">
              <div className="text-[9px] font-black text-primary uppercase tracking-widest">YENI PROXY</div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Proxy URL</label>
                  <input
                    type="text"
                    value={newProxy.proxy_url}
                    onChange={(e) => setNewProxy({ ...newProxy, proxy_url: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 font-mono"
                    placeholder="http://user:pass@host:port"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Tur</label>
                  <select
                    value={newProxy.proxy_type}
                    onChange={(e) => setNewProxy({ ...newProxy, proxy_type: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                    <option value="socks5">SOCKS5</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Ulke</label>
                  <input
                    type="text"
                    value={newProxy.country}
                    onChange={(e) => setNewProxy({ ...newProxy, country: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    placeholder="US"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Etiket</label>
                  <input
                    type="text"
                    value={newProxy.label}
                    onChange={(e) => setNewProxy({ ...newProxy, label: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    placeholder="Residential US #1"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCreateProxy}
                  disabled={!newProxy.proxy_url || actionLoading === "create-proxy"}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-xl text-xs font-black tracking-wider transition-all"
                >
                  {actionLoading === "create-proxy" ? "KAYDEDILIYOR..." : "PROXY EKLE"}
                </button>
              </div>
            </div>
          )}

          {/* Proxy Table */}
          {proxies.length === 0 ? (
            <div className="bg-black/40 border border-white/5 rounded-2xl p-12 text-center">
              <p className="text-zinc-600">Proxy yapilandirilmadi. Sosyal medya taramasi icin proxy ekleyin.</p>
            </div>
          ) : (
            <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">PROXY</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">TUR</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">ULKE</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-zinc-600 uppercase tracking-widest">DURUM</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">BASARILI</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">BASARISIZ</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">ORT (ms)</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">ISLEM</th>
                  </tr>
                </thead>
                <tbody>
                  {proxies.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-xs font-mono text-white truncate max-w-[250px]">{p.proxy_url}</div>
                        {p.label && <div className="text-[10px] text-zinc-600">{p.label}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{p.proxy_type}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{p.country || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`w-2 h-2 rounded-full inline-block mr-2 ${
                          p.is_active
                            ? p.last_check_ok === true ? "bg-emerald-500" : p.last_check_ok === false ? "bg-yellow-500" : "bg-blue-500"
                            : "bg-red-500"
                        }`}></span>
                        <span className="text-xs text-zinc-400">
                          {p.is_active ? (p.last_check_ok === true ? "OK" : p.last_check_ok === false ? "Uyari" : "Bekliyor") : "Deaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-emerald-400 font-bold">{p.success_count}</td>
                      <td className="px-4 py-3 text-right text-xs text-red-400 font-bold">{p.fail_count > 0 ? p.fail_count : "-"}</td>
                      <td className="px-4 py-3 text-right text-xs text-zinc-300">{p.avg_response_ms ?? "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteProxy(p.id)}
                          disabled={actionLoading === `del-proxy-${p.id}`}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                        >
                          SIL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Proxy Stats */}
          {proxies.length > 0 && (
            <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3">PROXY ISTATISTIKLERI</div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Toplam:</span>
                  <span className="text-white font-bold ml-2">{proxies.length}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Aktif:</span>
                  <span className="text-emerald-400 font-bold ml-2">{proxies.filter(p => p.is_active).length}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Deaktif:</span>
                  <span className="text-red-400 font-bold ml-2">{proxies.filter(p => !p.is_active).length}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Ort. Yanit:</span>
                  <span className="text-white font-bold ml-2">
                    {proxies.filter(p => p.avg_response_ms).length > 0
                      ? Math.round(proxies.filter(p => p.avg_response_ms).reduce((a, b) => a + (b.avg_response_ms || 0), 0) / proxies.filter(p => p.avg_response_ms).length)
                      : "-"} ms
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "config" && config && (
        <div className="space-y-6">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">ARAMA AYARLARI</div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Benzerlik Esigi</label>
                <div className="text-lg font-bold text-white">{config.similarity_threshold}</div>
                <div className="text-[10px] text-zinc-600">0.0 - 1.0 arasi (yuksek = daha siki eslesme)</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Top-K Varsayilan</label>
                <div className="text-lg font-bold text-white">{config.top_k_default}</div>
                <div className="text-[10px] text-zinc-600">Her aramada dondurulecek max sonuc</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Min Yuz Tespit Skoru</label>
                <div className="text-lg font-bold text-white">{config.min_face_det_score}</div>
                <div className="text-[10px] text-zinc-600">Dusuk degerler daha fazla yuz tespit eder</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Max Yuz / Gorsel</label>
                <div className="text-lg font-bold text-white">{config.max_faces_per_image}</div>
                <div className="text-[10px] text-zinc-600">Bir gorselden alinacak max yuz sayisi</div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">CRAWLER AYARLARI</div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Varsayilan RPM</label>
                <div className="text-lg font-bold text-white">{config.crawler_default_rpm}</div>
                <div className="text-[10px] text-zinc-600">Domain basina dakikada max istek</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Concurrent</label>
                <div className="text-lg font-bold text-white">{config.crawler_concurrent}</div>
                <div className="text-[10px] text-zinc-600">Esanli indirme sayisi</div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-red-500/20 rounded-2xl p-6">
            <div className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-4">TEHLIKELI ISLEMLER</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">FAISS Index Sifirla</div>
                <div className="text-[10px] text-zinc-600">Tum indeksleninis yuzler silinir. Yeniden crawl gerekir.</div>
              </div>
              <button
                onClick={handleReindex}
                disabled={actionLoading === "reindex"}
                className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-black tracking-wider transition-all disabled:opacity-50"
              >
                {actionLoading === "reindex" ? "SIFIRLANIYOR..." : "INDEXI SIFIRLA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
