"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Gift, Search } from "lucide-react";
import { adminListReferrals } from "@/lib/adminApi";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListReferrals(adminKey, { limit: 100 });
      setReferrals(data.referrals || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">REFERANS <span className="text-zinc-700">SİSTEMİ</span></h1>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
          <Gift size={12} /> Referans takibini görüntüle
        </p>
      </div>

      <GlassCard className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="text"
              placeholder="Referans ara..."
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Referrer</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Referral</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Ödül</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Durum</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white">{ref.referrer_email}</td>
                    <td className="py-4 px-4 text-zinc-400">{ref.referred_email}</td>
                    <td className="py-4 px-4 text-primary font-black">${ref.reward_amount}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        ref.is_completed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {ref.is_completed ? "Tamamlandı" : "Beklemede"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
