"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, Search } from "lucide-react";
import { adminListGuestBankInquiries } from "@/lib/adminApi";

export default function GuestBankInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListGuestBankInquiries(adminKey, { limit: 100 });
      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">MİSAFİR <span className="text-zinc-700">TALEPLERI</span></h1>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
          <FileText size={12} /> Misafir banka transfer taleplerini görüntüle
        </p>
      </div>

      <GlassCard className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="text"
              placeholder="Talep ara..."
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
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-black/40 border border-white/5 rounded-lg p-4 hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white font-black uppercase tracking-tight">{inquiry.email}</p>
                    <p className="text-zinc-500 text-sm mt-1">{inquiry.message}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-[10px] font-black text-zinc-500 uppercase">{new Date(inquiry.created_at).toLocaleDateString("tr-TR")}</span>
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
