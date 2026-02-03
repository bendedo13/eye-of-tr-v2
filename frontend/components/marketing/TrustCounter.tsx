"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CreditCard, ShoppingBag, Sparkles } from "lucide-react";

type EventItem = {
  name: string;
  item: string;
  at: number;
};

const trNames = [
  "Ayşe K.",
  "Mehmet A.",
  "Elif Y.",
  "Ahmet D.",
  "Zeynep Ç.",
  "Merve T.",
  "Fatma S.",
  "Ali B.",
  "Emre K.",
  "Hakan Ö.",
  "Ceren P.",
  "Ece G.",
  "Bora Y.",
  "Deniz A.",
  "Seda K.",
  "Oğuz D.",
  "İpek M.",
  "Gizem Ş.",
  "Can E.",
  "Selin K."
];

const itemsTR = ["2 kredi paketi", "6 kredi paketi", "Basic plan", "Pro plan", "Unlimited plan"];
const itemsEN = ["2-credit pack", "6-credit pack", "Basic plan", "Pro plan", "Unlimited plan"];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TrustCounter({ locale }: { locale: string }) {
  const [count, setCount] = useState(() => Math.floor(15 + Math.random() * (2000 - 15)));
  const [events, setEvents] = useState<EventItem[]>([]);

  const labels = useMemo(() => {
    if (locale === "tr") {
      return {
        title: "Bugün satın alanlar",
        sim: "Pazarlama simülasyonu",
        justNow: "Az önce",
        minute: "dk önce",
        bought: "satın aldı"
      };
    }
    return {
      title: "Purchases today",
      sim: "Promotional simulation",
      justNow: "Just now",
      minute: "min ago",
      bought: "purchased"
    };
  }, [locale]);

  useEffect(() => {
    const seed: EventItem[] = Array.from({ length: 3 }).map((_, i) => ({
      name: trNames[(Math.floor(Math.random() * trNames.length) + i) % trNames.length],
      item: (locale === "tr" ? itemsTR : itemsEN)[Math.floor(Math.random() * (locale === "tr" ? itemsTR : itemsEN).length)],
      at: Date.now() - Math.floor(Math.random() * 180000)
    }));
    setEvents(seed);
  }, [locale]);

  useEffect(() => {
    const t = setInterval(() => {
      setCount((c) => clamp(c + (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.15 ? 2 : 0), 15, 2000));

      setEvents((prev) => {
        const next: EventItem[] = [
          {
            name: trNames[Math.floor(Math.random() * trNames.length)],
            item: (locale === "tr" ? itemsTR : itemsEN)[Math.floor(Math.random() * (locale === "tr" ? itemsTR : itemsEN).length)],
            at: Date.now()
          },
          ...prev
        ].slice(0, 4);
        return next;
      });
    }, 5200);
    return () => clearInterval(t);
  }, [locale]);

  return (
    <div className="fixed right-6 bottom-6 z-50 hidden md:block">
      <GlassCard className="w-[360px] p-5 bg-black/60 border border-white/10 shadow-2xl shadow-black/60" hasScanline>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{labels.sim}</div>
            <div className="text-white font-black tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-primary" /> {labels.title}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-primary tracking-tighter">{count.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")}</div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {events.map((e, idx) => {
            const minutes = Math.floor((Date.now() - e.at) / 60000);
            const when = minutes <= 0 ? labels.justNow : `${minutes} ${labels.minute}`;
            const Icon = e.item.includes("plan") || e.item.includes("plan") ? CreditCard : ShoppingBag;
            return (
              <div
                key={`${e.name}-${e.at}-${idx}`}
                className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-white text-xs font-black tracking-tight">
                      {e.name}{" "}
                      <span className="text-zinc-500 font-bold">
                        {labels.bought} {e.item}
                      </span>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{when}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

