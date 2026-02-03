"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardStats, getCurrentSubscription } from "@/lib/api";
import { useTranslations } from "next-intl";
import ClientOnly from "@/components/ClientOnly";
import Navbar from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import {
  Zap,
  Search,
  Activity,
  Users,
  Gift,
  Copy,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Globe
} from "lucide-react";
import { toast } from "@/lib/toast";

interface DashboardData {
  user: any;
  credits: any;
  search_stats: any;
  referral: any;
}

import { use } from "react";

export default function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const t = useTranslations('dashboard');

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [mounted, loading, user, router, locale]);

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">Synchronizing Data...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-background text-slate-200">
        <Navbar />

        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">{t('title')} <span className="text-zinc-700">{t('subtitle')}</span></h1>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <ShieldCheck size={12} className="text-primary" /> {t('analyst')}: <span className="text-white">{dashboardData?.user?.username || user.email}</span>
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => router.push(`/${locale}/search`)} className="h-14 px-8 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/5 hover:bg-white/10" variant="outline">
                <Clock size={16} className="mr-2" /> {t('viewArchive')}
              </Button>
              <Button onClick={() => router.push(`/${locale}/data-platform`)} className="h-14 px-8 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/5 hover:bg-white/10" variant="outline">
                <Globe size={16} className="mr-2" /> {locale === "tr" ? "Veri Platformu" : "Data Platform"}
              </Button>
              <Button onClick={() => router.push(`/${locale}/search`)} className="h-14 px-8 text-[10px] font-black uppercase tracking-widest">
                <Search size={16} className="mr-2" /> {t('startNewSearch')}
              </Button>
            </div>
          </div>

          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-white/5 rounded-[32px] animate-pulse"></div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {/* Credits Card */}
                <GlassCard className="p-8 group hover:scale-[1.02] transition-transform duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:rotate-6 transition-transform">
                      <CreditCard size={24} />
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest border ${dashboardData?.credits?.tier === 'unlimited'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                      {dashboardData?.credits?.tier?.toUpperCase() || 'FREE'} PROTOCOL
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{t('operationalCredit')}</div>
                </GlassCard>

                {/* Total Searches */}
                <GlassCard className="p-8 group hover:scale-[1.02] transition-transform duration-500">
                  <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:rotate-6 transition-transform mb-6">
                    <Search size={24} />
                  </div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{t('totalSearches')}</div>
                </GlassCard>

                {/* Success Rate */}
                <GlassCard className="p-8 group hover:scale-[1.02] transition-transform duration-500">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:rotate-6 transition-transform mb-6">
                    <Activity size={24} />
                  </div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{t('successScore')}</div>
                </GlassCard>

                {/* Referrals */}
                <GlassCard className="p-8 group hover:scale-[1.02] transition-transform duration-500">
                  <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary group-hover:rotate-6 transition-transform mb-6">
                    <Users size={24} />
                  </div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{t('referrals')}</div>
                </GlassCard>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Referral Section */}
                <GlassCard className="lg:col-span-2 p-10 overflow-hidden relative" hasScanline>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                  <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-10">
                    <div className="flex-1">
                      <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight flex items-center gap-3">
                        <Gift size={24} className="text-primary" /> {t('referralProtocol')}
                      </h2>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-10 max-w-md">
                        {t('referralDescription')}
                      </p>

                      <div className="space-y-4">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{t('referralCode')}</div>
                        <div className="flex items-center gap-3 w-full max-w-sm">
                          <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-6 py-4 font-black text-primary tracking-[0.3em] font-mono">
                            {dashboardData?.referral?.referral_code || 'LOD-X92'}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/register?ref=${dashboardData?.referral?.referral_code}`
                              );
                              toast.success("Referans linki kopyalandı!");
                            }}
                            className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-zinc-400 transition-all border border-white/5"
                          >
                            <Copy size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                      {[
                        { label: t('totalInvites'), val: dashboardData?.referral?.total_referrals || 0 },
                        { label: t('creditEarnings'), val: dashboardData?.referral?.total_credits_earned || 0 },
                        { label: t('remainingTarget'), val: dashboardData?.referral?.next_credit_in || 0 }
                      ].map((s, idx) => (
                        <div key={idx} className="bg-white/5 rounded-2xl p-6 border border-white/5 text-center min-w-[120px]">
                          <div className="text-2xl font-black text-white mb-1">{s.val}</div>
                          <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                {/* Quick Actions */}
                <GlassCard className="p-10 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white mb-8 uppercase tracking-tight">{t('quickActions')}</h2>
                    <div className="space-y-4">
                      <button
                        onClick={() => router.push(`/${locale}/search`)}
                        className="w-full h-16 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                      >
                        <Search size={18} /> {t('newSearch')}
                      </button>
                      <button
                        onClick={() => router.push(`/${locale}/pricing`)}
                        className="w-full h-16 bg-white/5 text-white font-black uppercase tracking-[0.2em] rounded-2xl border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-zinc-400"
                      >
                        <Zap size={18} /> {t('upgradePlan')}
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles size={16} className="text-primary" />
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">{t('premiumAdvantage')}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-medium">{t('premiumDescription')}</p>
                  </div>
                </GlassCard>
              </div>

              {/* Recent Searches */}
              {(dashboardData?.search_stats?.recent_searches?.length ?? 0) > 0 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tighter flex items-center gap-4">
                    <Clock size={24} className="text-zinc-700" /> {t('operationalHistory')}
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {dashboardData?.search_stats?.recent_searches?.map((search: any, idx: number) => (
                      <GlassCard key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-white/[0.02] transition-all group">
                        <div className="flex items-center gap-6 mb-4 md:mb-0">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${search.successful
                            ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500'
                            }`}>
                            {search.successful ? <ShieldCheck size={28} /> : <Search size={28} />}
                          </div>
                          <div>
                            <div className="text-white font-black text-sm uppercase tracking-tight mb-1">{search.type} {t('analysis')}</div>
                            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                              <Clock size={10} /> {new Date(search.date).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-10">
                          <div className="text-right">
                            <div className="text-white font-black text-base tracking-tighter">{search.results} <span className="text-[10px] text-zinc-600 uppercase">{t('matches')}</span></div>
                            {search.was_blurred ? (
                              <div className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest flex items-center justify-end gap-1"><ShieldCheck size={10} /> BLURRED</div>
                            ) : (
                              <div className="text-[9px] font-black text-primary/60 uppercase tracking-widest flex items-center justify-end gap-1"><Zap size={10} /> COMPLETED</div>
                            )}
                          </div>
                          <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-primary transition-all group-hover:border-primary/50">
                            <ArrowRight size={20} />
                          </button>
                        </div>
                      </GlassCard>
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
