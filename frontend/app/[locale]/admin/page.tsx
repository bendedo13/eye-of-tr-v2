"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Users,
  Search,
  CreditCard,
  Activity,
  Calendar,
  ArrowUpRight,
  Zap,
  LogOut,
  Settings,
  Bell,
  BarChart3
} from "lucide-react";
import { adminOverview } from "@/lib/adminApi";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function AdminDashboard() {
  const router = useRouter();
  const locale = useLocale();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const adminKey = localStorage.getItem("adminKey");
    if (!adminKey) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    setIsAuthenticated(true);
    fetchOverview();
  }, [locale, router]);

  const fetchOverview = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminOverview(adminKey);
      setOverview(data);
    } catch (error) {
      console.error("Stats fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminKey");
    localStorage.removeItem("admin");
    router.push(`/${locale}/admin/login`);
  };

  if (!isAuthenticated || loading) {
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
    { label: "Toplam Kullanıcı", value: overview?.total_users || 0, icon: <Users size={24} />, color: "from-blue-500 to-indigo-600" },
    { label: "Aktif (5dk)", value: overview?.active_users_5m || 0, icon: <Activity size={24} />, color: "from-emerald-500 to-teal-600" },
    { label: "Aktif (Bugün)", value: overview?.active_users_today || 0, icon: <Activity size={24} />, color: "from-cyan-500 to-blue-600" },
    { label: "Arama (24s)", value: overview?.searches_24h || 0, icon: <Search size={24} />, color: "from-violet-500 to-purple-600" },
    { label: "Ödeyen Kullanıcı", value: overview?.paying_users || 0, icon: <CreditCard size={24} />, color: "from-amber-500 to-orange-600" },
    { label: "Toplam Gelir", value: `$${(overview?.revenue_total || 0).toFixed(2)}`, icon: <CreditCard size={24} />, color: "from-primary to-secondary" },
  ];

  const adminMenus = [
    { label: "Kullanıcılar", href: `/${locale}/admin/users`, icon: <Users size={16} /> },
    { label: "Ödemeler", href: `/${locale}/admin/payments`, icon: <CreditCard size={16} /> },
    { label: "Ayarlar", href: `/${locale}/admin/settings`, icon: <Settings size={16} /> },
    { label: "Bildirimler", href: `/${locale}/admin/notifications`, icon: <Bell size={16} /> },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">ANALYTICS <span className="text-zinc-700">COMMAND</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <BarChart3 size={12} /> Real-time System Intelligence Overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white/5 border border-white/5 px-6 py-3 rounded-2xl">
            <Calendar size={16} className="text-zinc-500" />
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
          >
            <LogOut size={16} />
            <span className="text-xs font-black uppercase">Çıkış</span>
          </button>
        </div>
      </div>

      {/* Admin Menu */}
      <div className="flex gap-4 flex-wrap">
        {adminMenus.map((menu) => (
          <Link key={menu.href} href={menu.href}>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase">
              {menu.icon}
              {menu.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <GlassCard key={idx} className="p-8 group hover:scale-[1.02] transition-transform duration-500">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg shadow-black/20 mb-6 group-hover:rotate-6 transition-transform`}>
              {card.icon}
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-white tracking-tighter">{typeof card.value === 'string' ? card.value : card.value.toLocaleString()}</div>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{card.label}</div>
            </div>
            <ArrowUpRight size={16} className="absolute top-8 right-8 text-zinc-800 group-hover:text-primary transition-colors" />
          </GlassCard>
        ))}
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Recent Users */}
        <GlassCard className="lg:col-span-3 p-8 overflow-hidden" hasScanline>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Users size={20} className="text-primary" /> SON KAYITLAR
            </h2>
            <Link href={`/${locale}/admin/users`}>
              <a className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">TÜMÜNÜ GÖR</a>
            </Link>
          </div>
          <div className="space-y-4">
            {(overview?.recent_users || []).slice(0, 5).map((user: any) => (
              <div key={user.id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl p-5 group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-white font-black group-hover:bg-primary/20 group-hover:text-primary transition-all">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white text-sm font-black uppercase tracking-tight">{user.username || user.email.split('@')[0]}</div>
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{user.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-black text-sm">{user.credits} <span className="text-[10px] opacity-50">CRD</span></div>
                  <div className="text-zinc-600 text-[9px] font-bold uppercase tracking-tighter">{new Date(user.created_at).toLocaleDateString("tr-TR")}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recent Searches */}
        <GlassCard className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Search size={20} className="text-primary" /> SON ARAMALAR
            </h2>
          </div>
          <div className="space-y-4">
            {(overview?.recent_searches || []).slice(0, 5).map((search: any) => (
              <div key={search.id} className="flex items-center justify-between bg-black/20 rounded-2xl p-5 border border-white/5 hover:border-primary/20 transition-all">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Search size={16} />
                  </div>
                  <div>
                    <div className="text-white text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{search.search_type}</div>
                    <div className="text-zinc-600 text-[9px] font-bold">{new Date(search.created_at).toLocaleTimeString("tr-TR")}</div>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${search.is_successful
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                  {search.is_successful ? "SUCCESS" : "NO MATCH"}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
