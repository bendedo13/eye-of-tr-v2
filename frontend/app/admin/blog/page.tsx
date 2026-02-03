"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  adminCreateBlogPost,
  adminDeleteBlogPost,
  adminGetBlogPost,
  adminListBlogPosts,
  adminUpdateBlogPost,
} from "@/lib/adminApi";

export default function AdminBlogPage() {
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

  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") || "" : "";

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
      window.location.href = "/admin/login";
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

  const previewHtml = useMemo(() => form.content_html || "", [form.content_html]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Blog Yönetimi</h1>
          <p className="text-slate-400 text-sm">TR/EN blog yazıları oluştur, yayınla ve düzenle</p>
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
          <button onClick={fetchList} className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl">
            Yenile
          </button>
          <button onClick={openNew} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
            Yeni Yazı
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-black/30 text-white font-semibold">Yazılar</div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="px-6 py-6 text-slate-400">Yükleniyor...</div>
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
              <div className="px-6 py-6 text-slate-400">Henüz yazı yok.</div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-3 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-white font-semibold">{editingId ? `Düzenle #${editingId}` : "Yeni Yazı"}</div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-slate-300 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                />
                Yayında
              </label>
              {editingId && (
                <button
                  onClick={async () => {
                    if (!confirm("Bu yazıyı silmek istiyor musunuz?")) return;
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
                  setBusy(true);
                  try {
                    const payload = { ...form, locale };
                    if (editingId) {
                      await adminUpdateBlogPost(adminKey, editingId, payload);
                    } else {
                      const created = await adminCreateBlogPost(adminKey, payload);
                      setEditingId(created.id);
                    }
                    await fetchList();
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
              <label className="block text-slate-400 text-sm mb-1">Başlık</label>
              <input
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="Yazı başlığı"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm mb-1">Özet</label>
              <textarea
                value={form.excerpt || ""}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[70px]"
                placeholder="Kısa açıklama"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm mb-1">Kapak Görsel URL</label>
              <input
                value={form.cover_image_url || ""}
                onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">İçerik (HTML)</label>
              <textarea
                value={form.content_html || ""}
                onChange={(e) => setForm({ ...form, content_html: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white min-h-[320px] font-mono text-xs"
                placeholder="<p>...</p>"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Önizleme</label>
              <div className="w-full min-h-[320px] bg-black/30 border border-white/5 rounded-xl p-4 overflow-auto prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

