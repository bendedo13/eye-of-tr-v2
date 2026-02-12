"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, Plus } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">YASAL <span className="text-zinc-700">İÇERİK</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <FileText size={12} /> Yasal belgeleri yönet
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase">
          <Plus size={16} /> Yeni Belge
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: "Kullanım Şartları", updated: "2026-02-13" },
          { title: "Gizlilik Politikası", updated: "2026-02-13" },
          { title: "Çerez Politikası", updated: "2026-02-13" },
          { title: "İade Politikası", updated: "2026-02-13" },
        ].map((doc) => (
          <GlassCard key={doc.title} className="p-6 hover:border-primary/30 transition-all cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-black uppercase tracking-tight">{doc.title}</h3>
                <p className="text-zinc-500 text-xs mt-2">Son güncelleme: {new Date(doc.updated).toLocaleDateString("tr-TR")}</p>
              </div>
              <FileText size={24} className="text-primary" />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
