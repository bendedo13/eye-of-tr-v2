"use client";

import { useEffect, useState } from "react";
import { adminApproveBankTransfer, adminListBankTransfers, adminRejectBankTransfer } from "@/lib/adminApi";
import { GlassCard } from "@/components/ui/GlassCard";

type BankTransferItem = {
  id: number;
  user_id: number;
  email: string;
  username: string;
  plan_id?: string | null;
  plan_name?: string | null;
  credits_requested?: number | null;
  amount: number;
  currency: string;
  status: string;
  user_note?: string | null;
  admin_note?: string | null;
  created_at?: string | null;
  reviewed_at?: string | null;
};

export default function AdminBankTransfersPage() {
  const [items, setItems] = useState<BankTransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const res = await adminListBankTransfers(adminKey, { status: statusFilter || undefined, limit: 200, offset: 0 });
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const setBusy = (id: number, value: boolean) => {
    setActionLoading((prev) => ({ ...prev, [id]: value }));
  };

  const handleApprove = async (id: number) => {
    const adminKey = localStorage.getItem("adminKey") || "";
    setBusy(id, true);
    try {
      await adminApproveBankTransfer(adminKey, id, { admin_note: notes[id] || undefined, message: notes[id] || undefined });
      await fetchData();
    } finally {
      setBusy(id, false);
    }
  };

  const handleReject = async (id: number) => {
    const reason = (notes[id] || "").trim();
    if (!reason) {
      alert("Reddetmek icin aciklama yazin.");
      return;
    }
    const adminKey = localStorage.getItem("adminKey") || "";
    setBusy(id, true);
    try {
      await adminRejectBankTransfer(adminKey, id, { admin_note: reason, message: reason });
      await fetchData();
    } finally {
      setBusy(id, false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Banka Transfer Talepleri</h1>
          <p className="text-slate-400 text-sm">Havale/EFT/FAST taleplerini onaylayin veya reddedin</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2"
          >
            <option value="pending">Beklemede</option>
            <option value="approved">Onaylandi</option>
            <option value="rejected">Reddedildi</option>
            <option value="">Hepsi</option>
          </select>
          <button onClick={fetchData} className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl">
            Yenile
          </button>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-200">
            <thead className="bg-slate-900/70 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">Kullanici</th>
                <th className="text-left px-4 py-3">Plan/Kredi</th>
                <th className="text-left px-4 py-3">Tutar</th>
                <th className="text-left px-4 py-3">Durum</th>
                <th className="text-left px-4 py-3">Not</th>
                <th className="text-left px-4 py-3">Islem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>Yukleniyor...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>Talep yok.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-800/60">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-white">{item.username || "-"}</div>
                      <div className="text-xs text-slate-500">{item.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white">{item.plan_name || item.plan_id || "Kredi"}</div>
                      <div className="text-xs text-slate-500">Kredi: {item.credits_requested || "-"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white">{item.amount} {item.currency}</div>
                      <div className="text-xs text-slate-500">ID: {item.id}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded-lg text-xs bg-slate-800 border border-slate-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <textarea
                        value={notes[item.id] ?? (item.admin_note || "")}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-56 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                        placeholder="Admin notu / gerekce"
                      />
                      {item.user_note && (
                        <div className="text-[10px] text-slate-500 mt-2">Kullanici: {item.user_note}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={actionLoading[item.id]}
                          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-60"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          disabled={actionLoading[item.id]}
                          className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs disabled:opacity-60"
                        >
                          Reddet
                        </button>
                      </div>
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
