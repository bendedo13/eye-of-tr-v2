"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Users,
  Search,
  UserPlus,
  CreditCard,
  Activity,
  ShieldAlert,
  Calendar,
  ArrowUpRight,
  Zap
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminKey = localStorage.getItem("adminKey");
    if (!adminKey) {
      window.location.href = "/admin/login";
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const res = await fetch("/api/admin/stats", { headers: { "x-admin-key": adminKey } });
      const data = await res.json();
      setStats(data.stats);
      setRecentUsers(data.recentUsers || []);
      setRecentSearches(data.recentSearches || []);
    } catch (error) {
      console.error("Stats fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={20} className="text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Toplam Kullanıcı", value: stats?.totalUsers || 0, icon: <Users size={24} />, color: "from-blue-500 to-indigo-600" },
    { label: "Aktif Kullanıcı", value: stats?.activeUsers || 0, icon: <Activity size={24} />, color: "from-emerald-500 to-teal-600" },
    { label: "Engelli Kullanıcı", value: stats?.bannedUsers || 0, icon: <ShieldAlert size={24} />, color: "from-rose-500 to-pink-600" },
    { label: "Toplam Arama", value: stats?.totalSearches || 0, icon: <Search size={24} />, color: "from-violet-500 to-purple-600" },
    { label: "Bugünkü Arama", value: stats?.todaySearches || 0, icon: <Zap size={24} />, color: "from-amber-500 to-orange-600" },
    { label: "Bugünkü Kayıt", value: stats?.todaySignups || 0, icon: <UserPlus size={24} />, color: "from-cyan-500 to-blue-600" },
    { label: "Toplam Kredi", value: stats?.totalCredits || 0, icon: <CreditCard size={24} />, color: "from-primary to-secondary" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">ANALYTICS <span className="text-zinc-700">COMMAND</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <Activity size={12} /> Real-time System Intelligence Overview
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 px-6 py-3 rounded-2xl">
          <Calendar size={16} className="text-zinc-500" />
          <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <GlassCard key={idx} className="p-8 group hover:scale-[1.02] transition-transform duration-500">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg shadow-black/20 mb-6 group-hover:rotate-6 transition-transform`}>
              {card.icon}
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-white tracking-tighter">{card.value.toLocaleString()}</div>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{card.label}</div>
            </div>
            <ArrowUpRight size={16} className="absolute top-8 right-8 text-zinc-800 group-hover:text-primary transition-colors" />
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <GlassCard className="lg:col-span-3 p-8 overflow-hidden" hasScanline>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Users size={20} className="text-primary" /> SON KAYITLAR
            </h2>
            <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">TÜMÜNÜ GÖR</button>
          </div>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl p-5 group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-white font-black group-hover:bg-primary/20 group-hover:text-primary transition-all">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white text-sm font-black uppercase tracking-tight">{user.name || user.email.split('@')[0]}</div>
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{user.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-black text-sm">{user.credits} <span className="text-[10px] opacity-50">CRD</span></div>
                  <div className="text-zinc-600 text-[9px] font-bold uppercase tracking-tighter">{new Date(user.createdAt).toLocaleDateString("tr-TR")}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Search size={20} className="text-primary" /> SON ARAMALAR
            </h2>
          </div>
          <div className="space-y-4">
            {recentSearches.map((search) => (
              <div key={search.id} className="flex items-center justify-between bg-black/20 rounded-2xl p-5 border border-white/5 hover:border-primary/20 transition-all">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Search size={16} />
                  </div>
                  <div>
                    <div className="text-white text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{search.user?.email || "Anonim"}</div>
                    <div className="text-zinc-600 text-[9px] font-bold">{new Date(search.createdAt).toLocaleTimeString("tr-TR")}</div>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${search.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                  {search.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
