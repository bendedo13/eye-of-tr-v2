"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Image as ImageIcon, Upload } from "lucide-react";

export default function HomeMediaPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">ANA SAYFA <span className="text-zinc-700">MEDYASI</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <ImageIcon size={12} /> Ana sayfa medyasını yönet
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase">
          <Upload size={16} /> Yükle
        </button>
      </div>

      <GlassCard className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: "Hero Banner", size: "1920x1080" },
            { name: "Feature 1", size: "800x600" },
            { name: "Feature 2", size: "800x600" },
            { name: "Footer Logo", size: "200x200" },
          ].map((item) => (
            <div key={item.name} className="bg-black/40 border border-white/5 rounded-lg p-6 hover:border-primary/30 transition-all">
              <div className="aspect-video bg-zinc-900 flex items-center justify-center rounded-lg mb-4">
                <ImageIcon size={48} className="text-zinc-700" />
              </div>
              <p className="text-white font-black uppercase text-sm">{item.name}</p>
              <p className="text-zinc-500 text-xs">{item.size}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
