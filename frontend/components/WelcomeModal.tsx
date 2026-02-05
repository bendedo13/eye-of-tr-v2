"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Zap, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setIsOpen(true);
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
      />
      
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in duration-300">
        <GlassCard className="p-8 border-primary/30 shadow-[0_0_50px_rgba(0,217,255,0.2)]" hasScanline>
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(0,217,255,0.3)]">
              <ShieldCheck size={40} className="text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                Hoş Geldiniz <span className="text-primary">Analist</span>
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                FaceSeek operasyonel arama terminaline erişiminiz onaylandı.
              </p>
            </div>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                  <Zap size={24} />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-bold uppercase tracking-wider text-sm">1 Ücretsiz Kredi Tanımlandı</h3>
                  <p className="text-zinc-500 text-xs mt-1">Hemen ilk aramanızı gerçekleştirebilirsiniz.</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setIsOpen(false)}
              className="w-full h-14 text-sm font-black uppercase tracking-widest"
            >
              Terminale Giriş Yap
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
