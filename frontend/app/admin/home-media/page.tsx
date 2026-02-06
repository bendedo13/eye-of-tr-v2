"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { adminGetSiteSettings, adminSetSiteSetting, adminUploadMedia } from "@/lib/adminApi";

function resolveUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

export default function AdminHomeMediaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroImageTitle, setHeroImageTitle] = useState("");
  const [analysisVideoUrl, setAnalysisVideoUrl] = useState("");
  const [analysisVideoTitle, setAnalysisVideoTitle] = useState("");

  const resolvedHeroImage = useMemo(() => resolveUrl(heroImageUrl), [heroImageUrl]);
  const resolvedAnalysisVideo = useMemo(() => resolveUrl(analysisVideoUrl), [analysisVideoUrl]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const adminKey = localStorage.getItem("adminKey") || "";
        const res = await adminGetSiteSettings(adminKey);
        const s = res.settings || {};
        setHeroImageUrl(s["home.hero_image_url"] || "");
        setHeroImageTitle(s["home.hero_image_title"] || "");
        setAnalysisVideoUrl(s["home.analysis_video_url"] || "");
        setAnalysisVideoTitle(s["home.analysis_video_title"] || "");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSetting = async (key: string, value: any) => {
    const adminKey = localStorage.getItem("adminKey") || "";
    await adminSetSiteSetting(adminKey, key, value);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("home.hero_image_url", heroImageUrl || null),
        saveSetting("home.hero_image_title", heroImageTitle || null),
        saveSetting("home.analysis_video_url", analysisVideoUrl || null),
        saveSetting("home.analysis_video_title", analysisVideoTitle || null),
      ]);
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File, setter: (v: string) => void, folder = "admin") => {
    const adminKey = localStorage.getItem("adminKey") || "";
    const res = await adminUploadMedia(adminKey, file, folder);
    setter(res.url);
  };

  if (loading) {
    return <div className="text-slate-400">Yukleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Ana Sayfa Medya</h1>
          <p className="text-slate-400 text-sm">
            Buradan ana sayfada gorunecek gorsel ve videolari ayarlayabilirsiniz.
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-60"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-6 space-y-4">
          <div className="text-white font-semibold">Hero Arka Plan Gorseli</div>
          <input
            value={heroImageTitle}
            onChange={(e) => setHeroImageTitle(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
            placeholder="Gorsel Basligi (opsiyonel)"
          />
          <input
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
            placeholder="Gorsel URL"
          />
          <div className="flex items-center gap-3">
            <label className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white cursor-pointer">
              Gorsel Yukle
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await upload(f, setHeroImageUrl, "admin");
                  e.target.value = "";
                }}
              />
            </label>
            <button onClick={() => setHeroImageUrl("")} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white">
              Temizle
            </button>
          </div>
          <div className="text-xs text-slate-500">Gorunur alan: Ana sayfa hero bolumu arka plani.</div>
          {resolvedHeroImage && (
            <div className="rounded-xl overflow-hidden border border-slate-700">
              <img src={resolvedHeroImage} alt="Hero Preview" className="w-full h-56 object-cover" />
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6 space-y-4">
          <div className="text-white font-semibold">Analiz Alani Videosu</div>
          <input
            value={analysisVideoTitle}
            onChange={(e) => setAnalysisVideoTitle(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
            placeholder="Video Basligi (opsiyonel)"
          />
          <input
            value={analysisVideoUrl}
            onChange={(e) => setAnalysisVideoUrl(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
            placeholder="Video URL"
          />
          <div className="flex items-center gap-3">
            <label className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white cursor-pointer">
              Video Yukle
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await upload(f, setAnalysisVideoUrl, "admin");
                  e.target.value = "";
                }}
              />
            </label>
            <button onClick={() => setAnalysisVideoUrl("")} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white">
              Temizle
            </button>
          </div>
          <div className="text-xs text-slate-500">Gorunur alan: Ana sayfa “Analiz Et” karti.</div>
          {resolvedAnalysisVideo && (
            <div className="rounded-xl overflow-hidden border border-slate-700">
              <video src={resolvedAnalysisVideo} controls className="w-full h-56 object-cover" />
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
