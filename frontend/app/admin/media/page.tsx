"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { adminListMedia, adminUploadMedia } from "@/lib/adminApi";

export default function AdminMediaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListMedia(adminKey, { limit: 200, offset: 0 });
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const adminKey = localStorage.getItem("adminKey");
    if (!adminKey) {
      setItems([]);
      setLoading(false);
      return;
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Medya</h1>
          <p className="text-slate-400 text-sm">Görsel yükle, URL kopyala, sitenin her yerinde kullan</p>
        </div>

        <div className="flex items-center gap-3">
          <label className={`px-4 py-2 rounded-xl text-white cursor-pointer ${uploading ? "bg-slate-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
            {uploading ? "Yükleniyor..." : "Görsel Yükle"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const adminKey = localStorage.getItem("adminKey") || "";
                  await adminUploadMedia(adminKey, file, "admin");
                  await fetchData();
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
              disabled={uploading}
            />
          </label>
          <button onClick={fetchData} className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl">
            Yenile
          </button>
        </div>
      </div>

      {copied && <div className="text-sm text-green-400">Kopyalandı: {copied}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {loading ? (
          <div className="text-slate-400">Yükleniyor...</div>
        ) : (
          items.map((m) => (
            <GlassCard key={m.id} className="p-3">
              <div className="aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/5">
                <img src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${m.url}`} alt={m.filename} className="w-full h-full object-cover" />
              </div>
              <div className="mt-3">
                <div className="text-white text-xs font-semibold truncate">{m.filename}</div>
                <div className="text-slate-500 text-[10px] truncate">{m.content_type}</div>
              </div>
              <button
                className="mt-3 w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs"
                onClick={async () => {
                  const full = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${m.url}`;
                  await navigator.clipboard.writeText(full);
                  setCopied(full);
                  setTimeout(() => setCopied(""), 2000);
                }}
              >
                URL Kopyala
              </button>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
