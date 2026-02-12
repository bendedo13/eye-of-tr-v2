"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Image as ImageIcon, Upload, Search } from "lucide-react";
import { adminListMedia } from "@/lib/adminApi";

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListMedia(adminKey, { limit: 100 });
      setMedia(data.media || []);
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">MEDYA <span className="text-zinc-700">YÖNETİMİ</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <ImageIcon size={12} /> Sistem medyasını yönet
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase">
          <Upload size={16} /> Yükle
        </button>
      </div>

      <GlassCard className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="text"
              placeholder="Medya ara..."
              className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {media.map((item) => (
              <div key={item.id} className="bg-black/40 border border-white/5 rounded-lg overflow-hidden hover:border-primary/30 transition-all group">
                <div className="aspect-square bg-zinc-900 flex items-center justify-center">
                  <ImageIcon size={32} className="text-zinc-700" />
                </div>
                <div className="p-3">
                  <p className="text-white text-xs font-black truncate">{item.filename}</p>
                  <p className="text-zinc-500 text-[10px]">{(item.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
