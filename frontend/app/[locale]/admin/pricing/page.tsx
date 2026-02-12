"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CreditCard, Edit2 } from "lucide-react";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">FİYATLANDIRMA <span className="text-zinc-700">YÖNETİMİ</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <CreditCard size={12} /> Fiyatlandırma planlarını yönet
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase">
          <Edit2 size={16} /> Düzenle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: "Başlangıç", price: "$9.99", features: ["100 Arama", "Temel Destek"] },
          { name: "Profesyonel", price: "$29.99", features: ["1000 Arama", "Öncelikli Destek", "API Erişimi"] },
          { name: "Kurumsal", price: "Özel", features: ["Sınırsız Arama", "Özel Destek", "Özel Entegrasyon"] },
        ].map((plan) => (
          <GlassCard key={plan.name} className="p-6">
            <h3 className="text-white font-black uppercase text-lg mb-2">{plan.name}</h3>
            <p className="text-primary font-black text-2xl mb-6">{plan.price}</p>
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="text-zinc-400 text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  {feature}
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
