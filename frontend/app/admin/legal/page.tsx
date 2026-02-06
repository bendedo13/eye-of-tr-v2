"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { adminGetSiteSettings, adminSetSiteSetting, adminUploadMedia } from "@/lib/adminApi";
import { toast } from "@/lib/toast";

const PAGES = [
  { slug: "about", labelTr: "HakkÄ±mÄ±zda", labelEn: "About" },
  { slug: "privacy", labelTr: "Gizlilik", labelEn: "Privacy" },
  { slug: "kvkk", labelTr: "KVKK", labelEn: "KVKK" },
  { slug: "terms", labelTr: "Åartlar", labelEn: "Terms" },
  { slug: "disclaimer", labelTr: "Sorumluluk", labelEn: "Disclaimer" },
];

export default function AdminLegalPage() {
  const [locale, setLocale] = useState<"tr" | "en">("tr");
  const [activeSlug, setActiveSlug] = useState(PAGES[0].slug);
  const [form, setForm] = useState({ title: "", subtitle: "", content_html: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") || "" : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || origin;

  const settingKey = `legal.${locale}.${activeSlug}`;

  const resolveHtmlMedia = (html: string) =>
    html
      .replace(/src=(["'])https?:\/\/[^"']+\/uploads\//g, "src=$1/api/uploads/")
      .replace(/href=(["'])https?:\/\/[^"']+\/uploads\//g, "href=$1/api/uploads/")
      .replace(/src=(["'])\/uploads\//g, "src=$1/api/uploads/")
      .replace(/href=(["'])\/uploads\//g, "href=$1/api/uploads/");

  const previewHtml = useMemo(() => {
    const raw = (form.content_html || "").trim();
    if (!raw) return "";
    if (raw.includes("<")) return resolveHtmlMedia(raw);
    return raw
      .split(/\n{2,}/)
      .map((block: string) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }, [form.content_html]);

  const load = async () => {
    if (!adminKey) {
      setLoading(false);
      setForm({ title: "", subtitle: "", content_html: "" });
      return;
    }
    setLoading(true);
    try {
      const data = await adminGetSiteSettings(adminKey);
      const value = data.settings?.[settingKey];
      if (value && typeof value === "object") {
        setForm({
          title: value.title || "",
          subtitle: value.subtitle || "",
          content_html: value.content_html || value.html || "",
        });
      } else if (typeof value === "string") {
        setForm({ title: "", subtitle: "", content_html: value });
      } else {
        setForm({ title: "", subtitle: "", content_html: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [locale, activeSlug]);

  const handleSave = async () => {
    if (!adminKey) {
      toast.error("Admin anahtarÄ± bulunamadÄ±.");
      return;
    }
    if (!form.title?.trim()) {
      toast.error("BaÅŸlÄ±k zorunlu");
      return;
    }
    if (!form.content_html?.trim()) {
      toast.error("Ä°Ã§erik zorunlu");
      return;
    }
    setSaving(true);
    try {
      await adminSetSiteSetting(adminKey, settingKey, {
        title: form.title.trim(),
        subtitle: form.subtitle?.trim() || "",
        content_html: form.content_html,
        updated_at: new Date().toISOString(),
      });
      toast.success("Kaydedildi");
    } catch (err: any) {
      toast.error(err?.message || "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    if (!adminKey) {
      toast.error("Admin anahtarÄ± bulunamadÄ±.");
      return;
    }
    setUploading(true);
    try {
      const res = await adminUploadMedia(adminKey, file, "legal");
      setUploadedUrl(res.url || "");
      toast.success("GÃ¶rsel yÃ¼klendi");
    } catch (err: any) {
      toast.error(err?.message || "GÃ¶rsel yÃ¼kleme baÅŸarÄ±sÄ±z");
    } finally {
      setUploading(false);
    }
  };

  const activeLabel = PAGES.find((p) => p.slug === activeSlug);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Yasal Sayfalar</h1>
          <p className="text-slate-400 text-sm">TR/EN yasal iÃ§erikleri dÃ¼zenle ve yayÄ±nla</p>
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as any)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="tr">tr</option>
            <option value="en">en</option>
          </select>
          <button onClick={load} className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl">
            Yenile
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" disabled={saving}>
            Kaydet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-black/30 text-white font-semibold">Sayfalar</div>
          <div className="divide-y divide-white/5">
            {PAGES.map((page) => {
              const label = locale === "tr" ? page.labelTr : page.labelEn;
              const isActive = activeSlug === page.slug;
              return (
                <button
                  key={page.slug}
                  className={`w-full text-left px-6 py-4 hover:bg-white/5 ${isActive ? "bg-white/5" : ""}`}
                  onClick={() => setActiveSlug(page.slug)}
                >
                  <div className="text-white font-semibold">{label}</div>
                  <div className="text-slate-500 text-xs">legal.{locale}.{page.slug}</div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-3 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-white font-semibold">
              {activeLabel ? (locale === "tr" ? activeLabel.labelTr : activeLabel.labelEn) : "Sayfa"}
            </div>
          </div>

          {loading ? (
            <div className="text-slate-400">YÃ¼kleniyor...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">BaÅŸlÄ±k</label>
                  <input
                    value={form.title || ""}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="Sayfa baÅŸlÄ±ÄŸÄ±"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Alt BaÅŸlÄ±k</label>
                  <input
                    value={form.subtitle || ""}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="KÄ±sa aÃ§Ä±klama"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Ä°Ã§erik (HTML)</label>
                  <textarea
                    value={form.content_html || ""}
                    onChange={(e) => setForm({ ...form, content_html: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[260px] font-mono text-xs"
                    placeholder="<h2>...</h2><p>...</p>"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">GÃ¶rsel YÃ¼kle (isteÄŸe baÄŸlÄ±)</label>
                  <div className="flex items-center gap-3">
                    <label
                      className="flex items-center justify-center px-4 py-2 bg-slate-800 border border-dashed border-slate-600 rounded-xl text-slate-300 cursor-pointer hover:border-indigo-500"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleUpload(e.dataTransfer.files?.[0]);
                      }}
                    >
                      {uploading ? "YÃ¼kleniyor..." : "YÃ¼kle / SÃ¼rÃ¼kle"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
                    </label>
                    {uploadedUrl ? (
                      <button
                        className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl"
                        onClick={() => navigator.clipboard.writeText(uploadedUrl)}
                      >
                        URL Kopyala
                      </button>
                    ) : null}
                  </div>
                  {uploadedUrl ? (
                    <div className="mt-3 text-xs text-slate-400 break-all">{apiBase}/api{uploadedUrl}</div>
                  ) : null}
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Ã–nizleme</label>
                  <div className="w-full min-h-[220px] bg-black/30 border border-white/5 rounded-xl p-5 overflow-auto">
                    <article className="prose prose-invert max-w-none">
                      {form.title ? <h1>{form.title}</h1> : null}
                      {form.subtitle ? <p className="lead">{form.subtitle}</p> : null}
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </article>
                  </div>
                </div>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
