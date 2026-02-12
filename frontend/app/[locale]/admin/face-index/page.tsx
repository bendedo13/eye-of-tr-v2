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
    adminFaceIndexReactivateProxies,
    adminFaceIndexToggleProxy,
} from "@/lib/adminApi";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { toast } from "@/lib/toast";

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

export default function FaceIndexPage({ params }: { params: { locale: string } }) {
    const locale = params.locale;
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("overview");
    const [loading, setLoading] = useState(true);
    const [adminKey, setAdminKey] = useState("");
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

    const fetchAll = useCallback(async (key?: string) => {
        const activeKey = key || adminKey;
        if (!activeKey) return;

        try {
            const [st, src, jb, cfg, prx] = await Promise.all([
                adminFaceIndexStatus(activeKey),
                adminFaceIndexListSources(activeKey),
                adminFaceIndexListJobs(activeKey, { limit: 50 }),
                adminFaceIndexGetConfig(activeKey),
                adminFaceIndexListProxies(activeKey),
            ]);
            setStatusData(st);
            setSources(src || []);
            setJobs(jb || []);
            setConfig(cfg);
            setProxies(prx || []);
            setError(null);
        } catch (e: any) {
            setError(e.message || "Failed to load data");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [adminKey]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("admin");
            if (stored) {
                const parsed = JSON.parse(stored);
                setAdminKey(parsed.key);
                fetchAll(parsed.key);
            } else {
                router.push(`/${locale}/admin/login`);
            }
        } catch (e) {
            console.error("Admin auth error:", e);
            router.push(`/${locale}/admin/login`);
        }
    }, []);

    useEffect(() => {
        if (!adminKey) return;
        const interval = setInterval(() => fetchAll(), 15000);
        return () => clearInterval(interval);
    }, [adminKey, fetchAll]);

    const handleCreateSource = async () => {
        setActionLoading("create");
        try {
            await adminFaceIndexCreateSource(adminKey, newSource);
            setShowNewSource(false);
            toast.success("Kaynak eklendi");
            setNewSource({ name: "", kind: "website", base_url: "", is_enabled: true, rate_limit_rpm: 30, rate_limit_concurrent: 2, schedule_cron: "", schedule_enabled: false, crawl_config_json: '{"max_pages": 50, "depth": 2}' });
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteSource = async (id: number) => {
        if (!confirm("Bu kaynagi silmek istediginize emin misiniz? Tum iliskili veriler silinecek.")) return;
        setActionLoading(`del-${id}`);
        try {
            await adminFaceIndexDeleteSource(adminKey, id);
            toast.success("Kaynak silindi");
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleSource = async (src: Source) => {
        setActionLoading(`toggle-${src.id}`);
        try {
            await adminFaceIndexUpdateSource(adminKey, src.id, { is_enabled: !src.is_enabled });
            toast.success("Durum güncellendi");
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleTriggerCrawl = async (sourceId: number) => {
        setActionLoading(`crawl-${sourceId}`);
        try {
            await adminFaceIndexTriggerCrawl(adminKey, sourceId);
            toast.success("Crawl işlemi sıraya alındı");
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelJob = async (jobId: number) => {
        setActionLoading(`cancel-${jobId}`);
        try {
            await adminFaceIndexCancelJob(adminKey, jobId);
            toast.success("İş iptal edildi");
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReindex = async () => {
        if (!confirm("FAISS index sifirlanacak. Devam etmek istiyor musunuz?")) return;
        setActionLoading("reindex");
        try {
            await adminFaceIndexReindex(adminKey);
            toast.success("Index sıfırlandı");
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateProxy = async () => {
        setActionLoading("create-proxy");
        try {
            await adminFaceIndexCreateProxy(adminKey, {
                proxy_url: newProxy.proxy_url,
                proxy_type: newProxy.proxy_type,
                country: newProxy.country || null,
                label: newProxy.label || null,
            });
            setShowNewProxy(false);
            toast.success("Proxy eklendi");
            setNewProxy({ proxy_url: "", proxy_type: "http", country: "", label: "" });
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteProxy = async (id: number) => {
        setActionLoading(`del-proxy-${id}`);
        try {
            await adminFaceIndexDeleteProxy(adminKey, id);
            toast.success("Proxy silindi");
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleTestProxies = async () => {
        setActionLoading("test-proxies");
        try {
            const result = await adminFaceIndexTestProxies(adminKey);
            toast.info(`Test tamamlandı: ${result.ok} başarılı, ${result.failed} başarısız`);
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleImportProxies = async () => {
        if (!importText.trim()) return;
        setActionLoading("import-proxies");
        try {
            const result = await adminFaceIndexImportProxies(adminKey, { proxies: importText, proxy_type: importType });
            toast.success(`Import: ${result.added} eklendi, ${result.skipped} atlandı`);
            setShowImportProxy(false);
            setImportText("");
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReactivateProxies = async () => {
        setActionLoading("reactivate-proxies");
        try {
            const result = await adminFaceIndexReactivateProxies(adminKey);
            toast.success(`${result.count} proxy tekrar aktifleştirildi`);
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleProxy = async (proxyId: number) => {
        setActionLoading(`toggle-proxy-${proxyId}`);
        try {
            await adminFaceIndexToggleProxy(adminKey, proxyId);
            toast.success("Proxy durumu değiştirildi");
            await fetchAll();
        } catch (e: any) {
            toast.error(e.message);
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
        { key: "overview", label: "GENEL BAKIŞ" },
        { key: "sources", label: "KAYNAKLAR" },
        { key: "jobs", label: "İŞLER" },
        { key: "proxies", label: "PROXY'LER" },
        { key: "config", label: "KONFİGÜRASYON" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">FACE INDEX & CREW</h1>
                    <p className="text-zinc-500 text-sm mt-1">Self-hosted yüz veritabanı ve otomasyon yönetimi</p>
                </div>
                <button
                    onClick={() => fetchAll()}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all"
                >
                    YENİLE
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-4 text-red-300 hover:text-white">X</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all ${tab === t.key
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Toplam Yüz", value: statusData.total_faces.toLocaleString(), color: "text-primary" },
                            { label: "Toplam Görsel", value: statusData.total_images.toLocaleString(), color: "text-blue-400" },
                            { label: "Aktif Kaynak", value: `${statusData.active_sources}/${statusData.total_sources}`, color: "text-emerald-400" },
                            { label: "Çalışan İş", value: statusData.running_jobs.toString(), color: "text-yellow-400" },
                        ].map((stat) => (
                            <GlassCard key={stat.label} className="p-5 border-white/5">
                                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">{stat.label}</div>
                                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                            </GlassCard>
                        ))}
                    </div>

                    <GlassCard className="p-6 border-white/5">
                        <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">INDEX DETAY</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
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
                    </GlassCard>

                    <GlassCard className="p-6 border-white/5">
                        <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">SON İŞLER</div>
                        {jobs.length === 0 ? (
                            <p className="text-zinc-600 text-sm">Henüz iş yok</p>
                        ) : (
                            <div className="space-y-2">
                                {jobs.slice(0, 5).map((j) => (
                                    <div key={j.id} className="flex flex-wrap items-center justify-between py-3 border-b border-white/5 last:border-0 gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-zinc-500 text-xs font-mono">#{j.id}</span>
                                            <StatusBadge status={j.status} />
                                            <span className="text-zinc-400 text-xs">
                                                {j.pages_crawled} sf. / {j.images_downloaded} gorsel / {j.faces_indexed} yuz
                                            </span>
                                        </div>
                                        <span className="text-zinc-600 text-[10px]">
                                            {j.created_at ? new Date(j.created_at).toLocaleString("tr-TR") : ""}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}

            {tab === "sources" && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowNewSource(!showNewSource)}
                            className="px-5 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-xl text-xs font-black tracking-wider transition-all"
                        >
                            {showNewSource ? "İPTAL" : "+ KAYNAK EKLE"}
                        </button>
                    </div>

                    {showNewSource && (
                        <GlassCard className="p-6 border-primary/30 space-y-4">
                            <div className="text-[9px] font-black text-primary uppercase tracking-widest">YENİ KAYNAK</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ad</label>
                                    <input
                                        className="input-field w-full h-11 text-sm"
                                        placeholder="Magazin Haberleri"
                                        value={newSource.name}
                                        onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tür</label>
                                    <select
                                        className="input-field w-full h-11 text-sm bg-black"
                                        value={newSource.kind}
                                        onChange={(e) => setNewSource({ ...newSource, kind: e.target.value })}
                                    >
                                        <option value="website">Website</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="twitter">Twitter / X</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="open_dataset">Open Dataset</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Base URL / Username</label>
                                    <input
                                        className="input-field w-full h-11 text-sm"
                                        placeholder="https://example.com/faces"
                                        value={newSource.base_url}
                                        onChange={(e) => setNewSource({ ...newSource, base_url: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Crawl Config (JSON)</label>
                                    <input
                                        className="input-field w-full h-11 text-sm font-mono"
                                        value={newSource.crawl_config_json}
                                        onChange={(e) => setNewSource({ ...newSource, crawl_config_json: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleCreateSource}
                                    disabled={actionLoading === "create"}
                                    className="px-8 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl text-xs font-black tracking-widest"
                                >
                                    {actionLoading === "create" ? "KAYDEDİLİYOR..." : "KAYNAĞI KAYDET"}
                                </button>
                            </div>
                        </GlassCard>
                    )}

                    <div className="overflow-x-auto bg-black/40 border border-white/5 rounded-2xl">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">KAYNAK</th>
                                    <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">TÜR</th>
                                    <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">DURUM</th>
                                    <th className="p-4 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">VERİ</th>
                                    <th className="p-4 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">İŞLEM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sources.map((src) => (
                                    <tr key={src.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4">
                                            <div className="text-sm font-bold text-white uppercase">{src.name}</div>
                                            <div className="text-[10px] text-zinc-500 truncate max-w-xs">{src.base_url}</div>
                                        </td>
                                        <td className="p-4"><span className="text-[10px] font-black text-zinc-400">{src.kind.toUpperCase()}</span></td>
                                        <td className="p-4">
                                            <span className={`w-2 h-2 rounded-full inline-block mr-2 ${src.is_enabled ? "bg-emerald-500" : "bg-zinc-600"}`}></span>
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase">{src.is_enabled ? "AKTİF" : "PASİF"}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-xs font-bold text-white">{src.total_faces_indexed} Yüz</div>
                                            <div className="text-[9px] text-zinc-500 uppercase">{src.total_images_found} Görsel</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleTriggerCrawl(src.id)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors border border-blue-500/20 text-[10px] font-bold">CRAWL</button>
                                                <button onClick={() => handleToggleSource(src)} className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-lg transition-colors border border-yellow-500/20 text-[10px] font-bold">DURUM</button>
                                                <button onClick={() => handleDeleteSource(src.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors border border-red-500/20 text-[10px] font-bold">SİL</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Proxies, Jobs, Config tabs remain logically the same but styled better */}
            {tab === "jobs" && (
                <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">ID</th>
                                <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">DURUM</th>
                                <th className="p-4 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">İLERLEME (YÜZ)</th>
                                <th className="p-4 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">TARİH</th>
                                <th className="p-4 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">İŞLEM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((j) => (
                                <tr key={j.id} className="border-b border-white/5">
                                    <td className="p-4 font-mono text-xs text-zinc-500">#{j.id}</td>
                                    <td className="p-4"><StatusBadge status={j.status} /></td>
                                    <td className="p-4 text-right font-bold text-primary text-sm">{j.faces_indexed}</td>
                                    <td className="p-4 text-right text-[10px] text-zinc-500 whitespace-nowrap">
                                        {j.created_at ? new Date(j.created_at).toLocaleString("tr-TR") : "-"}
                                    </td>
                                    <td className="p-4 text-right">
                                        {(j.status === "running" || j.status === "queued") && (
                                            <button onClick={() => handleCancelJob(j.id)} className="text-red-400 hover:text-red-300 text-[10px] font-black tracking-widest">İPTAL</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === "proxies" && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 justify-end">
                        <button
                            onClick={handleReactivateProxies}
                            disabled={actionLoading === "reactivate-proxies"}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black tracking-wider transition-all"
                        >
                            {actionLoading === "reactivate-proxies" ? "AKTİFLEŞTİRİLİYOR..." : "TÜM PROXYLERİ AKTİFLEŞTİR"}
                        </button>
                        <button
                            onClick={handleTestProxies}
                            disabled={actionLoading === "test-proxies"}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black tracking-wider transition-all"
                        >
                            {actionLoading === "test-proxies" ? "TEST EDİLİYOR..." : "PROXYLERİ TEST ET"}
                        </button>
                        <button
                            onClick={() => setShowImportProxy(!showImportProxy)}
                            className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-xs font-black tracking-wider transition-all"
                        >
                            {showImportProxy ? "İPTAL" : "TOPLU IMPORT"}
                        </button>
                        <button
                            onClick={() => setShowNewProxy(!showNewProxy)}
                            className="px-5 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-xl text-xs font-black tracking-wider transition-all"
                        >
                            {showNewProxy ? "İPTAL" : "+ PROXY EKLE"}
                        </button>
                    </div>

                    {showImportProxy && (
                        <GlassCard className="p-6 border-yellow-500/30 space-y-4">
                            <div className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">TOPLU PROXY IMPORT</div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Proxy Türü</label>
                                <select
                                    className="input-field w-full h-11 text-sm bg-black"
                                    value={importType}
                                    onChange={(e) => setImportType(e.target.value)}
                                >
                                    <option value="http">HTTP</option>
                                    <option value="https">HTTPS</option>
                                    <option value="socks5">SOCKS5</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Proxy Listesi (satır başına bir proxy)</label>
                                <textarea
                                    className="input-field w-full h-32 text-sm font-mono"
                                    placeholder={"ip:port\nip:port:user:pass\nhttp://user:pass@ip:port"}
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleImportProxies}
                                    disabled={actionLoading === "import-proxies"}
                                    className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-xs font-black tracking-widest"
                                >
                                    {actionLoading === "import-proxies" ? "İMPORT EDİLİYOR..." : "İMPORT ET"}
                                </button>
                            </div>
                        </GlassCard>
                    )}

                    {showNewProxy && (
                        <GlassCard className="p-6 border-primary/30 space-y-4">
                            <div className="text-[9px] font-black text-primary uppercase tracking-widest">YENİ PROXY</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Proxy URL</label>
                                    <input
                                        className="input-field w-full h-11 text-sm font-mono"
                                        placeholder="http://user:pass@ip:port"
                                        value={newProxy.proxy_url}
                                        onChange={(e) => setNewProxy({ ...newProxy, proxy_url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tür</label>
                                    <select
                                        className="input-field w-full h-11 text-sm bg-black"
                                        value={newProxy.proxy_type}
                                        onChange={(e) => setNewProxy({ ...newProxy, proxy_type: e.target.value })}
                                    >
                                        <option value="http">HTTP</option>
                                        <option value="https">HTTPS</option>
                                        <option value="socks5">SOCKS5</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ülke</label>
                                    <input
                                        className="input-field w-full h-11 text-sm"
                                        placeholder="TR"
                                        value={newProxy.country}
                                        onChange={(e) => setNewProxy({ ...newProxy, country: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Etiket</label>
                                    <input
                                        className="input-field w-full h-11 text-sm"
                                        placeholder="datacenter-1"
                                        value={newProxy.label}
                                        onChange={(e) => setNewProxy({ ...newProxy, label: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleCreateProxy}
                                    disabled={actionLoading === "create-proxy"}
                                    className="px-8 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl text-xs font-black tracking-widest"
                                >
                                    {actionLoading === "create-proxy" ? "KAYDEDİLİYOR..." : "PROXY KAYDET"}
                                </button>
                            </div>
                        </GlassCard>
                    )}

                    <div className="text-xs text-zinc-500 flex gap-4">
                        <span>Toplam: {proxies.length}</span>
                        <span className="text-emerald-400">Aktif: {proxies.filter(p => p.is_active).length}</span>
                        <span className="text-red-400">Pasif: {proxies.filter(p => !p.is_active).length}</span>
                    </div>

                    <div className="overflow-x-auto bg-black/40 border border-white/5 rounded-2xl">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">PROXY</th>
                                    <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">TÜR</th>
                                    <th className="p-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">DURUM</th>
                                    <th className="p-4 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">BAŞARI/HATA</th>
                                    <th className="p-4 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">HIZMS</th>
                                    <th className="p-4 text-right text-[9px] font-black text-zinc-600 uppercase tracking-widest">İŞLEM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proxies.map((p) => (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4">
                                            <div className="text-xs font-mono text-white truncate max-w-xs">{p.proxy_url}</div>
                                            <div className="text-[9px] text-zinc-600">{p.label || ""} {p.country || ""}</div>
                                        </td>
                                        <td className="p-4"><span className="text-[10px] font-black text-zinc-400 uppercase">{p.proxy_type}</span></td>
                                        <td className="p-4">
                                            <span className={`w-2 h-2 rounded-full inline-block mr-2 ${p.is_active ? "bg-emerald-500" : "bg-red-500"}`}></span>
                                            <span className={`text-[10px] font-bold uppercase ${p.is_active ? "text-emerald-400" : "text-red-400"}`}>{p.is_active ? "AKTİF" : "PASİF"}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-emerald-400 text-xs font-bold">{p.success_count}</span>
                                            <span className="text-zinc-600 mx-1">/</span>
                                            <span className="text-red-400 text-xs font-bold">{p.fail_count}</span>
                                        </td>
                                        <td className="p-4 text-right text-xs text-zinc-400">{p.avg_response_ms ? `${p.avg_response_ms}ms` : "-"}</td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleToggleProxy(p.id)} className={`p-2 rounded-lg transition-colors border text-[10px] font-bold ${p.is_active ? "hover:bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "hover:bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                                                    {p.is_active ? "DURDUR" : "AKTİFLE"}
                                                </button>
                                                <button onClick={() => handleDeleteProxy(p.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors border border-red-500/20 text-[10px] font-bold">SİL</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === "config" && config && (
                <div className="space-y-4">
                    <GlassCard className="p-6 border-white/5">
                        <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-6">SİSTEM KONFİGÜRASYONU</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: "Benzerlik Eşiği", value: config.similarity_threshold },
                                { label: "Top-K Varsayılan", value: config.top_k_default },
                                { label: "Min Yüz Skor", value: config.min_face_det_score },
                                { label: "Crawler RPM", value: config.crawler_default_rpm },
                                { label: "Eşzamanlı Crawler", value: config.crawler_concurrent },
                                { label: "Maks Yüz/Görsel", value: config.max_faces_per_image },
                            ].map((item) => (
                                <div key={item.label} className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-zinc-400 text-sm">{item.label}</span>
                                    <span className="text-white font-bold text-sm">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                    <div className="flex justify-end">
                        <button
                            onClick={handleReindex}
                            disabled={actionLoading === "reindex"}
                            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black tracking-widest"
                        >
                            {actionLoading === "reindex" ? "SIFIRLANIYOR..." : "INDEX SIFIRLA"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
