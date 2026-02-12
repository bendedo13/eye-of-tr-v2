"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { MessageSquare, Search, Filter } from "lucide-react";
import { adminListTickets } from "@/lib/adminApi";

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListTickets(adminKey, { limit: 100 });
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">DESTEK <span className="text-zinc-700">TİKETLERİ</span></h1>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
          <MessageSquare size={12} /> Müşteri destek taleplerini yönet
        </p>
      </div>

      <GlassCard className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="text"
              placeholder="Ticket ara..."
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
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-black/40 border border-white/5 rounded-lg p-4 hover:border-primary/30 transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-white font-black uppercase tracking-tight">#{ticket.id}</p>
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                        ticket.priority === "high" ? "bg-red-500/10 text-red-400" :
                        ticket.priority === "medium" ? "bg-amber-500/10 text-amber-400" :
                        "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm">{ticket.subject}</p>
                    <p className="text-zinc-600 text-xs mt-1">{ticket.user_email}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      ticket.status === "open" ? "bg-blue-500/10 text-blue-400" :
                      ticket.status === "in_progress" ? "bg-amber-500/10 text-amber-400" :
                      "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {ticket.status}
                    </span>
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
