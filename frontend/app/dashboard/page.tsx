"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardStats, getCurrentSubscription } from "@/lib/api";
import ClientOnly from "@/components/ClientOnly";
import Navbar from "@/components/Navbar";

interface DashboardData {
  user: any;
  credits: any;
  search_stats: any;
  referral: any;
}

export default function DashboardPage() {
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login");
    }
  }, [mounted, loading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        const [stats, sub] = await Promise.all([
          getDashboardStats(token),
          getCurrentSubscription(token)
        ]);
        
        setDashboardData(stats);
        setSubscription(sub);
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setDataLoading(false);
      }
    };

    if (mounted && token) {
      fetchData();
    }
  }, [mounted, token]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white mb-2 neon-text">
              Dashboard
            </h1>
            <p className="text-slate-400">
              Hoş geldin, <span className="text-indigo-400 font-semibold">{dashboardData?.user?.username || user.email}</span>
            </p>
          </div>

          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-dark animate-pulse">
                  <div className="h-24 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Credits Card */}
                <div className="card-dark group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">💳</div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      dashboardData?.credits?.tier === 'unlimited' 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                        : dashboardData?.credits?.tier === 'premium'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-slate-700'
                    }`}>
                      {dashboardData?.credits?.tier?.toUpperCase() || 'FREE'}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {dashboardData?.credits?.credits || 0}
                  </div>
                  <div className="text-sm text-slate-400">Kalan Kredi</div>
                  {dashboardData?.credits?.is_unlimited && (
                    <div className="mt-2 text-xs text-yellow-400">✨ Sınırsız</div>
                  )}
                </div>

                {/* Total Searches */}
                <div className="card-dark">
                  <div className="text-3xl mb-4">🔍</div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {dashboardData?.search_stats?.total_searches || 0}
                  </div>
                  <div className="text-sm text-slate-400">Toplam Arama</div>
                </div>

                {/* Success Rate */}
                <div className="card-dark">
                  <div className="text-3xl mb-4">✨</div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {dashboardData?.search_stats?.success_rate || 0}%
                  </div>
                  <div className="text-sm text-slate-400">Başarı Oranı</div>
                </div>

                {/* Referrals */}
                <div className="card-dark">
                  <div className="text-3xl mb-4">👥</div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {dashboardData?.referral?.total_referrals || 0}
                  </div>
                  <div className="text-sm text-slate-400">Referanslarım</div>
                  {dashboardData?.referral?.next_credit_in > 0 && (
                    <div className="mt-2 text-xs text-indigo-400">
                      {dashboardData.referral.next_credit_in} davet daha = 1 kredi
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Referral Section */}
                <div className="lg:col-span-2 card-dark">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span>🎁</span> Referans Sistemi
                  </h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Arkadaşlarını davet et, kredi kazan! Her 3 referans için 1 ücretsiz arama kredisi.
                  </p>

                  {/* Referral Code */}
                  <div className="bg-slate-800 rounded-lg p-4 mb-6">
                    <div className="text-xs text-slate-400 mb-2">Referans Kodun:</div>
                    <div className="flex items-center gap-3">
                      <code className="text-2xl font-mono font-bold text-indigo-400">
                        {dashboardData?.referral?.referral_code || 'LOADING'}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/register?ref=${dashboardData?.referral?.referral_code}`
                          );
                          alert('Referans linki kopyalandı!');
                        }}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        Kopyala
                      </button>
                    </div>
                  </div>

                  {/* Referral Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {dashboardData?.referral?.total_referrals || 0}
                      </div>
                      <div className="text-xs text-slate-400">Toplam Davet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {dashboardData?.referral?.total_credits_earned || 0}
                      </div>
                      <div className="text-xs text-slate-400">Kazanılan Kredi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {dashboardData?.referral?.next_credit_in || 0}
                      </div>
                      <div className="text-xs text-slate-400">Sonraki Krediye</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card-dark">
                  <h2 className="text-xl font-bold text-white mb-4">⚡ Hızlı Erişim</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/search')}
                      className="w-full btn-primary"
                    >
                      🔍 Yeni Arama
                    </button>
                    <button
                      onClick={() => router.push('/pricing')}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition"
                    >
                      💎 Upgrade
                    </button>
                    <button
                      onClick={() => router.push('/history')}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition"
                    >
                      📊 Geçmiş
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Searches */}
              {dashboardData?.search_stats?.recent_searches?.length > 0 && (
                <div className="mt-6 card-dark">
                  <h2 className="text-xl font-bold text-white mb-4">📜 Son Aramalar</h2>
                  <div className="space-y-3">
                    {dashboardData.search_stats.recent_searches.map((search: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">
                            {search.successful ? '✅' : '❌'}
                          </div>
                          <div>
                            <div className="text-white font-medium">{search.type}</div>
                            <div className="text-xs text-slate-400">
                              {new Date(search.date).toLocaleString('tr-TR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{search.results} sonuç</div>
                          {search.was_blurred && (
                            <div className="text-xs text-orange-400">🔒 Blur</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
