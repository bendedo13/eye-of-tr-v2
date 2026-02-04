"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { adminListPayments } from "@/lib/adminApi";

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListPayments(adminKey, { status: status || undefined, limit: 100, offset: 0 });
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
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Ödemeler</h1>
          <p className="text-slate-400 text-sm">Ödeme kayıtları ve ödeme yapan kullanıcı listesi</p>
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tümü</option>
            <option value="completed">completed</option>
            <option value="pending">pending</option>
            <option value="failed">failed</option>
          </select>
          <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
            Yenile
          </button>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30">
              <tr>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Kullanıcı</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Plan</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Tutar</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Durum</th>
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
                items.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{p.email}</div>
                      <div className="text-slate-500 text-xs">#{p.user_id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{p.plan_name}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {p.amount} {p.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          p.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : p.status === "failed"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(p.created_at).toLocaleString("tr-TR")}
                    </td>
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
