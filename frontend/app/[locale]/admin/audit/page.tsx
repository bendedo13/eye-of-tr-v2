"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ClipboardList, Search, Filter } from "lucide-react";
import { adminListAudit } from "@/lib/adminApi";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListAudit(adminKey, { limit: 100 });
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">AUDIT <span className="text-zinc-700">LOG</span></h1>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
          <ClipboardList size={12} /> Sistem aktivitelerini izle
        </p>
      </div>

      <GlassCard className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="text"
              placeholder="Log ara..."
              className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-black/40 border border-white/5 text-zinc-400 rounded-lg hover:border-primary/50 transition-all">
            <Filter size={18} /> Filtre
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-black/40 border border-white/5 rounded-lg p-4 hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-sm uppercase">{log.action}</p>
                    <p className="text-zinc-500 text-xs">{log.details}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-xs">{new Date(log.created_at).toLocaleString("tr-TR")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
