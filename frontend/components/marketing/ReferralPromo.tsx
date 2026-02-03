"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { Copy, Gift, ShieldCheck } from "lucide-react";

export default function ReferralPromo({ locale }: { locale: string }) {
  const { user } = useAuth();

  const copyText = useMemo(() => {
    if (!user?.referral_code) return null;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/${locale}/register?ref=${user.referral_code}`;
  }, [user?.referral_code, locale]);

  const title = locale === "tr" ? "Davet Programı" : "Referral Program";
  const subtitle =
    locale === "tr"
      ? "3 doğrulanmış davet = +1 arama kredisi"
      : "3 verified invites = +1 search credit";
  const note =
    locale === "tr"
      ? "Kendinizi davet edemezsiniz. Kötüye kullanım tespitinde krediler iptal edilebilir."
      : "Self-referrals are not allowed. Credits may be revoked in case of abuse.";

  return (
    <GlassCard className="max-w-7xl mx-auto px-8 py-10 mt-10" hasScanline>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
              {locale === "tr" ? "Güven + Gelir" : "Trust + Monetization"}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Gift size={22} className="text-primary" /> {title}
          </h2>
          <p className="text-zinc-500 text-sm font-medium max-w-2xl">{subtitle}</p>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">{note}</p>
        </div>

        <div className="w-full lg:w-auto space-y-4">
          {user?.referral_code ? (
            <>
              <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-2xl px-6 py-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  {locale === "tr" ? "KOD" : "CODE"}
                </div>
                <div className="text-white font-black tracking-[0.25em] text-sm">{user.referral_code}</div>
              </div>
              <Button
                className="w-full lg:w-[320px] h-14"
                onClick={async () => {
                  if (!copyText) return;
                  try {
                    await navigator.clipboard.writeText(copyText);
                    toast.success(locale === "tr" ? "Davet linki kopyalandı" : "Referral link copied");
                  } catch {
                    toast.error(locale === "tr" ? "Kopyalama başarısız" : "Copy failed");
                  }
                }}
              >
                <Copy size={16} className="mr-2" /> {locale === "tr" ? "Davet linkini kopyala" : "Copy invite link"}
              </Button>
            </>
          ) : (
            <Button className="w-full lg:w-[320px] h-14" onClick={() => (window.location.href = `/${locale}/register`)}>
              {locale === "tr" ? "Kayıt ol ve kodunu al" : "Register to get your code"}
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
