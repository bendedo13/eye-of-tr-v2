"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, Search, Filter, Download } from "lucide-react";
import { adminListUsers } from "@/lib/adminApi";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminListUsers(adminKey, { q: searchQuery, limit: 100 });
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">KULLANICI <span className="text-zinc-700">YÖNETİMİ</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <Users size={12} /> Sistem kullanıcılarını yönet
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase">
            <Download size={16} /> İndir
          </button>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Email</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Kullanıcı Adı</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Kredi</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Durum</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white">{user.email}</td>
                    <td className="py-4 px-4 text-zinc-400">{user.username || "-"}</td>
                    <td className="py-4 px-4 text-primary font-black">{user.credits}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        user.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {user.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-500 text-xs">{new Date(user.created_at).toLocaleDateString("tr-TR")}</td>
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
