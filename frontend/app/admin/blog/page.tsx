"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  adminCreateBlogPost,
  adminDeleteBlogPost,
  adminGetBlogPost,
  adminListBlogPosts,
  adminUpdateBlogPost,
  adminUploadMedia,
  adminTriggerBlogGeneration,
  adminGetBlogAutoStatus,
  adminGetSeoKeywords,
  adminUpdateSeoKeywords,
} from "@/lib/adminApi";
import { toast } from "@/lib/toast";

export default function AdminBlogPage() {
  const [activeTab, setActiveTab] = useState<"posts" | "auto">("posts");
  const [locale, setLocale] = useState<"tr" | "en">("tr");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({
    locale: "tr",
    slug: "",
    title: "",
    excerpt: "",
    cover_image_url: "",
    author_name: "FaceSeek",
    content_html: "",
    is_published: false,
  });
  const [busy, setBusy] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Auto-generation states
  const [autoStatus, setAutoStatus] = useState<any>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const [genLocale, setGenLocale] = useState<"tr" | "en">("tr");
  const [genCount, setGenCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoLocale, setSeoLocale] = useState<"tr" | "en">("tr");
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoSaving, setSeoSaving] = useState(false);

  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") || "" : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || origin;

  const resolveMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const parsed = new URL(url);
        if (parsed.pathname.startsWith("/uploads/")) {
          return `${apiBase}/api${parsed.pathname}`;
        }
      } catch {
        return url;
      }
      return url;
    }
    if (url.startsWith("/uploads/")) return `${apiBase}/api${url}`;
    return `${apiBase}${url}`;
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await adminListBlogPosts(adminKey, { locale });
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const k = localStorage.getItem("adminKey");
    if (!k) {
      setItems([]);
      setLoading(false);
      return;
    }
    fetchList();
  }, [locale]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      locale,
      slug: "",
      title: "",
      excerpt: "",
      cover_image_url: "",
      author_name: "FaceSeek",
      content_html: "",
      is_published: false,
    });
  };

  const openEdit = async (id: number) => {
    setBusy(true);
    try {
      const data = await adminGetBlogPost(adminKey, id);
      setEditingId(id);
      setForm(data.post);
    } finally {
      setBusy(false);
    }
  };

  const previewHtml = useMemo(() => {
    const raw = (form.content_html || "").trim();
    if (!raw) return "";
    if (raw.includes("<")) return raw;
    return raw
      .split(/\n{2,}/)
      .map((block: string) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }, [form.content_html]);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const handleCoverFile = async (file?: File | null) => {
    if (!file) return;
    if (!adminKey) {
      toast.error("Admin anahtari bulunamadi.");
      return;
    }
    setUploadingCover(true);
    try {
      const res = await adminUploadMedia(adminKey, file, "blog");
      setForm((prev: any) => ({ ...prev, cover_image_url: res.url }));
      toast.success("Kapak gorseli yuklendi");
    } catch (err: any) {
      toast.error(err?.message || "Gorsel yukleme basarisiz");
    } finally {
      setUploadingCover(false);
    }
  };

  // Auto-generation functions
  const fetchAutoStatus = async () => {
    setAutoLoading(true);
    try {
      const data = await adminGetBlogAutoStatus(adminKey);
      setAutoStatus(data);
    } catch (err: any) {
      toast.error(err?.message || "Durum alinamadi");
    } finally {
      setAutoLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await adminTriggerBlogGeneration(adminKey, {
        locale: genLocale,
        count: genCount,
      });
      toast.success(`${result.generated || 0} blog olusturuldu`);
      await fetchAutoStatus();
      await fetchList();
    } catch (err: any) {
      toast.error(err?.message || "Uretim basarisiz");
    } finally {
      setGenerating(false);
    }
  };

  const fetchSeoKeywords = async () => {
    setSeoLoading(true);
    try {
      const data = await adminGetSeoKeywords(adminKey, seoLocale);
      setSeoKeywords((data.keywords || []).join("\n"));
    } catch (err: any) {
      toast.error(err?.message || "Anahtar kelimeler alinamadi");
    } finally {
      setSeoLoading(false);
    }
  };

  const handleSaveSeoKeywords = async () => {
    setSeoSaving(true);
    try {
      const keywords = seoKeywords
        .split("\n")
        .map((k: string) => k.trim())
        .filter(Boolean);
      await adminUpdateSeoKeywords(adminKey, {
        locale: seoLocale,
        keywords,
      });
      toast.success("Anahtar kelimeler guncellendi");
    } catch (err: any) {
      toast.error(err?.message || "Kaydedilemedi");
    } finally {
      setSeoSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === "auto") {
      fetchAutoStatus();
      fetchSeoKeywords();
    }
  }, [activeTab, seoLocale]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Blog Yonetimi</h1>
          <p className="text-slate-400 text-sm">TR/EN blog yazilari ve oto-uretim sistemi</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 rounded-xl font-bold text-sm ${
              activeTab === "posts"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Yazilar
          </button>
          <button
            onClick={() => setActiveTab("auto")}
            className={`px-4 py-2 rounded-xl font-bold text-sm ${
              activeTab === "auto"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Oto Uretim
          </button>
        </div>
      </div>

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <>
          <div className="flex gap-3 items-center">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as any)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="tr">tr</option>
              <option value="en">en</option>
            </select>
            <button onClick={fetchList} className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl">
              Yenile
            </button>
            <button onClick={openNew} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
              Yeni Yazi
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-black/30 text-white font-semibold">Yazilar</div>
              <div className="divide-y divide-white/5">
                {loading ? (
                  <div className="px-6 py-6 text-slate-400">Yukleniyor...</div>
                ) : items.length ? (
                  items.map((p) => (
                    <button
                      key={p.id}
                      className={`w-full text-left px-6 py-4 hover:bg-white/5 ${editingId === p.id ? "bg-white/5" : ""}`}
                      onClick={() => openEdit(p.id)}
                      disabled={busy}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{p.title}</div>
                          <div className="text-slate-500 text-xs truncate">/{p.slug}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.is_published ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-300"}`}>
                          {p.is_published ? "published" : "draft"}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-6 py-6 text-slate-400">Henuz yazi yok.</div>
                )}
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-3 p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-white font-semibold">{editingId ? `Duzenle #${editingId}` : "Yeni Yazi"}</div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-slate-300 text-sm">
                    <input
                      type="checkbox"
                      checked={!!form.is_published}
                      onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    />
                    Yayinda
                  </label>
                  {editingId && (
                    <button
                      onClick={async () => {
                        if (!confirm("Bu yaziyi silmek istiyor musunuz?")) return;
                        setBusy(true);
                        try {
                          await adminDeleteBlogPost(adminKey, editingId);
                          openNew();
                          await fetchList();
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                      disabled={busy}
                    >
                      Sil
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!form.title?.trim()) {
                        toast.error("Baslik gerekli");
                        return;
                      }
                      let nextSlug = (form.slug || "").trim();
                      if (!nextSlug) {
                        nextSlug = slugify(form.title || "");
                      }
                      if (!nextSlug) {
                        toast.error("Slug gerekli");
                        return;
                      }
                      if (!form.content_html?.trim()) {
                        toast.error("Icerik (HTML) gerekli");
                        return;
                      }
                      setBusy(true);
                      try {
                        const payload = { ...form, slug: nextSlug, locale };
                        if (editingId) {
                          await adminUpdateBlogPost(adminKey, editingId, payload);
                        } else {
                          const created = await adminCreateBlogPost(adminKey, payload);
                          setEditingId(created.id);
                        }
                        await fetchList();
                        setForm((prev: any) => ({ ...prev, slug: nextSlug }));
                        toast.success("Kaydedildi");
                      } catch (err: any) {
                        toast.error(err?.message || "Kaydedilemedi");
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                    disabled={busy}
                  >
                    Kaydet
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Slug</label>
                  <input
                    value={form.slug || ""}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="my-post-slug"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Yazar</label>
                  <input
                    value={form.author_name || ""}
                    onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="FaceSeek"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 text-sm mb-1">Baslik</label>
                  <input
                    value={form.title || ""}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="Yazi basligi"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 text-sm mb-1">Ozet</label>
                  <textarea
                    value={form.excerpt || ""}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[70px]"
                    placeholder="Kisa aciklama"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 text-sm mb-1">Kapak Gorseli</label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-3">
                      <input
                        value={form.cover_image_url || ""}
                        onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                        placeholder="https://... veya yukleme yapin"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        className="flex items-center justify-center w-full px-4 py-2 bg-slate-800 border border-dashed border-slate-600 rounded-xl text-slate-300 cursor-pointer hover:border-indigo-500"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleCoverFile(e.dataTransfer.files?.[0]);
                        }}
                      >
                        {uploadingCover ? "Yukleniyor..." : "Yukle / Surukle"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleCoverFile(e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>
                  {form.cover_image_url ? (
                    <div className="mt-3">
                      <img
                        src={resolveMediaUrl(form.cover_image_url)}
                        alt="Kapak onizleme"
                        className="w-full max-h-56 object-cover rounded-xl border border-white/5"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Icerik (HTML)</label>
                  <textarea
                    value={form.content_html || ""}
                    onChange={(e) => setForm({ ...form, content_html: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[320px] font-mono text-xs"
                    placeholder="<p>...</p>"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Onizleme</label>
                  <div className="w-full min-h-[320px] bg-black/30 border border-white/5 rounded-xl p-5 overflow-auto">
                    <article className="prose prose-invert max-w-none">
                      {form.title ? <h1>{form.title}</h1> : null}
                      {form.cover_image_url ? (
                        <img src={resolveMediaUrl(form.cover_image_url)} alt="Kapak" />
                      ) : null}
                      {form.excerpt ? <p className="lead">{form.excerpt}</p> : null}
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </article>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {/* Auto Generation Tab */}
      {activeTab === "auto" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generate Section */}
          <GlassCard className="p-6 space-y-5">
            <h2 className="text-xl font-bold text-white">Blog Oto-Uretim</h2>
            <p className="text-slate-400 text-sm">
              AI ile SEO odakli blog icerik uretimi. OpenAI GPT-4o-mini kullanilarak profesyonel icerikler olusturulur.
            </p>

            {/* Status */}
            {autoLoading ? (
              <div className="text-slate-400 text-sm">Durum yukleniyor...</div>
            ) : autoStatus ? (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Bugun uretilen</span>
                  <span className="text-white font-bold">{autoStatus.today_generated || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Toplam AI blog</span>
                  <span className="text-white font-bold">{autoStatus.total_ai_posts || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Oto-uretim</span>
                  <span className={`font-bold ${autoStatus.config?.enabled ? "text-green-400" : "text-red-400"}`}>
                    {autoStatus.config?.enabled ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Gunluk hedef</span>
                  <span className="text-white font-bold">{autoStatus.config?.daily_count || 5} / locale</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Zamanlama</span>
                  <span className="text-white font-bold">{autoStatus.config?.schedule || "03:00"} UTC</span>
                </div>
              </div>
            ) : null}

            {/* Manual Trigger */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-sm">Manuel Uretim</h3>
              <div className="flex gap-3">
                <select
                  value={genLocale}
                  onChange={(e) => setGenLocale(e.target.value as any)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="tr">TR</option>
                  <option value="en">EN</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value) || 1)}
                  className="w-20 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {generating ? "Uretiliyor..." : "Simdi Uret"}
                </button>
              </div>
              {generating && (
                <p className="text-amber-400 text-xs">
                  AI blog uretimi devam ediyor. Bu islem birkai dakika surebilir...
                </p>
              )}
            </div>

            <button
              onClick={fetchAutoStatus}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl text-sm"
            >
              Durumu Yenile
            </button>
          </GlassCard>

          {/* SEO Keywords Section */}
          <GlassCard className="p-6 space-y-5">
            <h2 className="text-xl font-bold text-white">SEO Anahtar Kelimeler</h2>
            <p className="text-slate-400 text-sm">
              Blog icerik uretiminde kullanilacak anahtar kelimeleri yonetin. Her satira bir anahtar kelime yazin.
            </p>

            <div className="flex gap-3 items-center">
              <select
                value={seoLocale}
                onChange={(e) => setSeoLocale(e.target.value as any)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              >
                <option value="tr">TR</option>
                <option value="en">EN</option>
              </select>
              <button
                onClick={fetchSeoKeywords}
                className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl text-sm"
              >
                Yukle
              </button>
            </div>

            {seoLoading ? (
              <div className="text-slate-400 text-sm">Yukleniyor...</div>
            ) : (
              <textarea
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[250px] font-mono text-sm"
                placeholder="yuz tanima teknolojisi&#10;reverse image search&#10;OSINT rehberi&#10;dolandiricilik tespiti"
              />
            )}

            <button
              onClick={handleSaveSeoKeywords}
              disabled={seoSaving}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {seoSaving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
