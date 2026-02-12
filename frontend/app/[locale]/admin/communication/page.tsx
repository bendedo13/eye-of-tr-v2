"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Bell, Send, Plus } from "lucide-react";

export default function CommunicationPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">İLETİŞİM <span className="text-zinc-700">YÖNETİMİ</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <Bell size={12} /> Bildirim ve e-posta gönder
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase">
          <Plus size={16} /> Yeni Bildirim
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h2 className="text-white font-black uppercase text-lg mb-4 flex items-center gap-2">
            <Send size={20} className="text-primary" /> E-posta Gönder
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white font-black uppercase text-sm mb-2">Alıcı</label>
              <input
                type="email"
                placeholder="E-posta adresi"
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-white font-black uppercase text-sm mb-2">Konu</label>
              <input
                type="text"
                placeholder="E-posta konusu"
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-white font-black uppercase text-sm mb-2">İçerik</label>
              <textarea
                placeholder="E-posta içeriği"
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50 h-32"
              />
            </div>
            <button className="w-full px-4 py-3 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase">
              Gönder
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-white font-black uppercase text-lg mb-4 flex items-center gap-2">
            <Bell size={20} className="text-primary" /> Bildirim Gönder
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white font-black uppercase text-sm mb-2">Başlık</label>
              <input
                type="text"
                placeholder="Bildirim başlığı"
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-white font-black uppercase text-sm mb-2">İçerik</label>
              <textarea
                placeholder="Bildirim içeriği"
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50 h-32"
              />
            </div>
            <div>
              <label className="block text-white font-black uppercase text-sm mb-2">Hedef</label>
              <select className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50">
                <option>Tüm Kullanıcılar</option>
                <option>Ödeme Yapanlar</option>
                <option>Yeni Kullanıcılar</option>
              </select>
            </div>
            <button className="w-full px-4 py-3 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase">
              Gönder
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
