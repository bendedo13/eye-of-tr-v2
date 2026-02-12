"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CreditCard, Search, Filter, Check, X } from "lucide-react";
import { adminListBankTransfers, adminApproveBankTransfer, adminRejectBankTransfer } from "@/lib/adminApi";

export default function BankTransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListBankTransfers(adminKey, { limit: 100 });
      setTransfers(data.transfers || []);
    } catch (error) {
      console.error("Error fetching transfers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      await adminApproveBankTransfer(adminKey, id);
      fetchTransfers();
    } catch (error) {
      console.error("Error approving transfer:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      await adminRejectBankTransfer(adminKey, id, { message: "Reddedildi" });
      fetchTransfers();
    } catch (error) {
      console.error("Error rejecting transfer:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">BANKA <span className="text-zinc-700">TRANSFERLERİ</span></h1>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
          <CreditCard size={12} /> Banka transfer taleplerini yönet
        </p>
      </div>

      <GlassCard className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="text"
              placeholder="Transfer ara..."
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
            {transfers.map((transfer) => (
              <div key={transfer.id} className="bg-black/40 border border-white/5 rounded-lg p-4 hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-black uppercase tracking-tight">{transfer.user_email}</p>
                    <p className="text-zinc-500 text-sm">Tutar: ${transfer.amount}</p>
                  </div>
                  <div className="flex gap-2">
                    {transfer.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(transfer.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all text-xs font-black uppercase"
                        >
                          <Check size={14} /> Onayla
                        </button>
                        <button
                          onClick={() => handleReject(transfer.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-xs font-black uppercase"
                        >
                          <X size={14} /> Reddet
                        </button>
                      </>
                    )}
                    <span className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase ${
                      transfer.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : 
                      transfer.status === "rejected" ? "bg-red-500/10 text-red-400" :
                      "bg-amber-500/10 text-amber-400"
                    }`}>
                      {transfer.status}
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
