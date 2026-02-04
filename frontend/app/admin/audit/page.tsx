"use client";

import { useEffect, useMemo, useState } from "react";
import { adminListAudit } from "@/lib/adminApi";

function formatTs(ts: any) {
  try {
    return new Date(ts).toLocaleString("tr-TR");
  } catch {
    return String(ts || "");
  }
}

export default function AdminAuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");

  const actions = useMemo(() => {
    const uniq = new Set<string>();
    for (const it of items) {
      if (it?.action) uniq.add(String(it.action));
    }
    return Array.from(uniq).sort();
  }, [items]);

  useEffect(() => {
    const adminKey = localStorage.getItem("adminKey");
    if (!adminKey) {
      window.location.href = "/admin/login";
      return;
    }
    fetchAudit();
  }, [q, action]);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListAudit(adminKey, { q: q || undefined, action: action || undefined, limit: 200, offset: 0 });
      setItems(data.items || []);
    } catch (error) {
      console.error("Audit fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Audit Log</h1>
        <div className="text-slate-400">Toplam: {items.length}</div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Email / aksiyon / resource ara..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Tüm Aksiyonlar</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Zaman</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Aksiyon</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Admin</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Kaynak</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-slate-400" colSpan={5}>
                    Yükleniyor...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-slate-400" colSpan={5}>
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 text-slate-300 text-sm whitespace-nowrap">{formatTs(it.created_at)}</td>
                    <td className="px-6 py-4 text-white font-medium whitespace-nowrap">{it.action}</td>
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      <div className="space-y-1">
                        <div className="text-white">{it.actor_email || "-"}</div>
                        <div className="text-slate-500">{it.actor_ip || "-"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      <div className="space-y-1">
                        <div className="text-white">{it.resource_type || "-"}</div>
                        <div className="text-slate-500 break-all">{it.resource_id || "-"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs break-all">{it.trace_id || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

