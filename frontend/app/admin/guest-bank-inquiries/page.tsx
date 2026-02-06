"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { adminListGuestBankInquiries } from "@/lib/adminApi";

type GuestInquiry = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  desired_plan?: string | null;
  desired_credits?: number | null;
  message?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export default function GuestBankInquiriesPage() {
  const [items, setItems] = useState<GuestInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const res = await adminListGuestBankInquiries(adminKey, { limit: 200, offset: 0 });
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Misafir Havale Talepleri</h1>
          <p className="text-slate-400 text-sm">Kayit olmadan iletilen talepler</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl">
          Yenile
        </button>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-200">
            <thead className="bg-slate-900/70 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">Ad Soyad</th>
                <th className="text-left px-4 py-3">Iletisim</th>
                <th className="text-left px-4 py-3">Talep</th>
                <th className="text-left px-4 py-3">Mesaj</th>
                <th className="text-left px-4 py-3">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>Yukleniyor...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>Talep yok.</td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id} className="border-t border-slate-800/60">
                    <td className="px-4 py-4">
                      <div className="text-white font-semibold">{i.name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white">{i.email}</div>
                      <div className="text-xs text-slate-500">{i.phone || "-"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white">{i.desired_plan || "-"}</div>
                      <div className="text-xs text-slate-500">Kredi: {i.desired_credits || "-"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-300 text-xs whitespace-pre-wrap">{i.message || "-"}</div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{i.created_at || "-"}</td>
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
