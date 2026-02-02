"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const statCards = [
    { label: "Toplam Kullanıcı", value: stats?.totalUsers || 0, icon: "👥", color: "from-blue-500 to-cyan-500" },
    { label: "Aktif Kullanıcı", value: stats?.activeUsers || 0, icon: "✅", color: "from-green-500 to-emerald-500" },
    { label: "Engelli Kullanıcı", value: stats?.bannedUsers || 0, icon: "🚫", color: "from-red-500 to-pink-500" },
    { label: "Toplam Arama", value: stats?.totalSearches || 0, icon: "🔍", color: "from-purple-500 to-indigo-500" },
    { label: "Bugünkü Arama", value: stats?.todaySearches || 0, icon: "📊", color: "from-orange-500 to-amber-500" },
    { label: "Bugünkü Kayıt", value: stats?.todaySignups || 0, icon: "🆕", color: "from-teal-500 to-cyan-500" },
    { label: "Toplam Kredi", value: stats?.totalCredits || 0, icon: "💰", color: "from-yellow-500 to-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{card.icon}</span>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} opacity-20`}></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{card.value.toLocaleString()}</div>
            <div className="text-slate-400 text-sm">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Son Kayıtlar</h2>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{user.email}</div>
                    <div className="text-slate-400 text-xs">{new Date(user.createdAt).toLocaleDateString("tr-TR")}</div>
                  </div>
                </div>
                <div className="text-indigo-400 font-semibold">{user.credits} kredi</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Son Aramalar</h2>
          <div className="space-y-3">
            {recentSearches.map((search) => (
              <div key={search.id} className="flex items-center justify-between bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-full flex items-center justify-center">🔍</div>
                  <div>
                    <div className="text-white text-sm font-medium">{search.user?.email}</div>
                    <div className="text-slate-400 text-xs">{new Date(search.createdAt).toLocaleString("tr-TR")}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs ${search.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {search.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}