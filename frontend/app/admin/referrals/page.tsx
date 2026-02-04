"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { adminListReferrals } from "@/lib/adminApi";

export default function AdminReferralsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListReferrals(adminKey, { limit: 200, offset: 0 });
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
          <h1 className="text-3xl font-bold text-white">Referanslar</h1>
          <p className="text-slate-400 text-sm">Davet edilen kullanıcılar ve ödül dağıtımı</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
          Yenile
        </button>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30">
              <tr>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Referrer</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Referee</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Kod</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Ödül</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-slate-400" colSpan={5}>
                    Yükleniyor...
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-slate-200">#{r.referrer_user_id}</td>
                    <td className="px-6 py-4">
                      <div className="text-white">{r.referee_email}</div>
                      <div className="text-slate-500 text-xs">#{r.referee_user_id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{r.referrer_code}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.reward_given ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-300"}`}>
                        {r.reward_given ? `+${r.credits_awarded} kredi` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{new Date(r.created_at).toLocaleString("tr-TR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
