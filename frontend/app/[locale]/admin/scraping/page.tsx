"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { adminStartScraping } from "@/lib/adminApi";
import { Globe, Download, Play, CheckCircle, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function AdminScrapingPage() {
  const router = useRouter();
  const locale = useLocale();
  const [adminKey, setAdminKey] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (stored) {
      const parsed = JSON.parse(stored);
      setAdminKey(parsed.key);
    } else {
      // Fixed: Use dynamic locale instead of hardcoded /tr/
      router.push(`/${locale}/admin/login`);
    }
  }, [locale, router]);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return toast.error("URL zorunludur");

    setLoading(true);
    setLogs((prev) => [...prev, `[INIT] Taramayı başlat: ${url}`]);
    setResult(null);

    try {
      const res = await adminStartScraping(adminKey, url);
      
      if (res.status === "error") {
        setLogs((prev) => [...prev, `[ERROR] ${res.message}`]);
        toast.error("Tarama başarısız oldu");
      } else {
        setLogs((prev) => [...prev, `[SUCCESS] Domain: ${res.domain}`]);
        setLogs((prev) => [...prev, `[INFO] Bulunan: ${res.total_found}, İndirilen: ${res.total_downloaded}`]);
        setLogs((prev) => [...prev, `[DONE] Süre: ${res.duration_seconds}s`]);
        setResult(res);
        toast.success(`${res.total_downloaded} görsel indirildi`);
      }
    } catch (err: any) {
      setLogs((prev) => [...prev, `[FATAL] ${err.message}`]);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Web Scraping</h1>
        <p className="text-zinc-400 text-sm">Hedef web sitelerinden otomatik görsel veri toplayın ve indeksleyin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-6 bg-black/40 border-white/5">
            <h2 className="text-lg font-black text-white uppercase tracking-wide mb-6 flex items-center gap-2">
              <Globe size={20} className="text-primary" /> Hedef Belirle
            </h2>
            
            <form onSubmit={handleScrape} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Web Sitesi URL</label>
                <input
                  className="input-field w-full h-12 text-sm"
                  placeholder="https://example.com/gallery"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                 <div className="flex items-center gap-2 mb-2">
                    <Download size={16} className="text-primary" />
                    <span className="text-xs font-bold text-white">Otomasyon Ayarları</span>
                 </div>
                 <ul className="text-[10px] text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Maksimum 100 görsel</li>
                    <li>Sadece geçerli resim dosyaları</li>
                    <li>5KB altı dosyalar atlanır</li>
                    <li>User-Agent simülasyonu aktif</li>
                 </ul>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        TARANIYOR...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Play size={16} fill="currentColor" /> TARAMAYI BAŞLAT
                    </span>
                )}
              </Button>
            </form>
          </GlassCard>

          {/* Console Log */}
          <div className="bg-black font-mono text-xs p-4 rounded-xl border border-white/10 h-64 overflow-y-auto custom-scrollbar">
            <div className="text-zinc-500 mb-2 border-b border-white/5 pb-2">Scraper Console Output</div>
            {logs.length === 0 ? (
                <span className="text-zinc-700">Ready for commands...</span>
            ) : (
                logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.includes("ERROR") || log.includes("FATAL") ? "text-rose-500" : log.includes("SUCCESS") ? "text-emerald-500" : "text-zinc-300"}`}>
                        <span className="opacity-50 mr-2">{new Date().toLocaleTimeString()}</span>
                        {log}
                    </div>
                ))
            )}
          </div>
        </div>

        {/* Results Gallery */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6 bg-black/40 border-white/5 h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                <ImageIcon size={20} className="text-primary" /> Sonuç Galerisi
                </h2>
                {result && (
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-xs font-bold flex items-center gap-2">
                        <CheckCircle size={14} /> {result.total_downloaded} Başarılı
                    </div>
                )}
            </div>

            {!result ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-white/5 rounded-2xl">
                    <Globe size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-medium">Henüz tarama yapılmadı.</p>
                    <p className="text-xs">URL girin ve taramayı başlatın.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {result.images.map((img: any, idx: number) => (
                        <div key={idx} className="group relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-white/5 hover:border-primary/50 transition-colors">
                            {/* Gerçek uygulamada buraya backend'den serve edilen URL gelmeli */}
                            {/* Şimdilik sadece placeholder gösteriyoruz çünkü local file access browserda kısıtlı olabilir */}
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-600 text-[10px] p-2 text-center break-all">
                                {img.filename}
                            </div>
                             <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 backdrop-blur-sm text-[8px] text-zinc-400 truncate">
                                {img.local_path}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
