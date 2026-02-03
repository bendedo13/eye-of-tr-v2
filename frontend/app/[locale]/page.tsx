"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import LiveStats from "@/components/LiveStats";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { Button } from "@/components/ui/Button";
import FacialRecognitionDemo from "@/components/brand/FacialRecognitionDemo";
import { GlassCard } from "@/components/ui/GlassCard";
import ReferralPromo from "@/components/marketing/ReferralPromo";
import TrustCounter from "@/components/marketing/TrustCounter";
import {
  ShieldCheck,
  Search,
  Zap,
  Globe,
  Target,
  Lock,
  BarChart3,
  ArrowRight,
  Fingerprint,
  Layers,
  Sparkles
} from "lucide-react";

export default function Home({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Unwrap params Promise using React 19 'use' hook
  const { locale } = use(params);
  const { user, mounted, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('hero');
  const tFeatures = useTranslations('features');
  const tHowItWorks = useTranslations('howItWorks');
  const tWhyFaceSeek = useTranslations('whyFaceSeek');
  const tFeatureCards = useTranslations('featureCards');
  const tHowItWorksSection = useTranslations('howItWorksSection');
  const tCommon = useTranslations('common');
  const tHome = useTranslations('home');
  const tCta = useTranslations('cta');
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('nav');

  const [siteConfig, setSiteConfig] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiBase}/api/public/site-config?locale=${encodeURIComponent(locale)}`)
      .then((r) => r.json())
      .then((d) => setSiteConfig(d.config || {}))
      .catch(() => setSiteConfig(null));
  }, [locale]);

  const homeOverrides = useMemo(() => {
    const cfg = siteConfig || {};
    return {
      maintenanceMode: !!cfg["site.maintenance_mode"],
      heroBadge: cfg[`home.${locale}.hero_badge`],
      heroTitle: cfg[`home.${locale}.hero_title`],
      heroSubtitle: cfg[`home.${locale}.hero_subtitle`],
      privacyBadge: cfg[`home.${locale}.privacy_badge`],
      ctaTitlePart1: cfg[`home.${locale}.cta_title_part1`],
      ctaTitlePart2: cfg[`home.${locale}.cta_title_part2`],
      ctaDescription: cfg[`home.${locale}.cta_description`],
      ctaButton: cfg[`home.${locale}.cta_button`],
      heroImageUrl: cfg["home.hero_image_url"],
    };
  }, [siteConfig, locale]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">
          {tCommon("initializingProtocol")}
        </div>
      </div>
    );
  }

  if (homeOverrides.maintenanceMode) {
    return (
      <ClientOnly>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
          <div className="text-4xl font-black text-white uppercase tracking-tight mb-4">MAINTENANCE</div>
          <div className="text-zinc-500 text-sm font-medium max-w-xl">
            {locale === "tr" ? "Sistem kısa süreli bakım modunda. Lütfen daha sonra tekrar deneyin." : "The system is under maintenance. Please try again later."}
          </div>
        </div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-background text-slate-200 selection:bg-primary/30 selection:text-white">
        <Navbar />
        <TrustCounter locale={locale} />

        {/* Face Seek Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-24 px-6 circuit-pattern">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27] via-[#1a1f3a]/50 to-[#0a0e27] pointer-events-none"></div>
          <div className="absolute inset-0 data-stream opacity-30"></div>

          {/* Biometric Grid Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse"></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-[#0ea5e9] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          </div>

          <div className="relative max-w-7xl mx-auto text-center z-10">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-[#00d9ff]/10 border border-[#00d9ff]/30 px-4 py-2 rounded-full text-[#00d9ff] text-[10px] font-black uppercase tracking-[0.2em] mb-10 glow-cyan">
              <Sparkles size={12} className="animate-pulse" /> {homeOverrides.heroBadge || t('badge')}
            </div>
            <div className="flex justify-center mb-10 -mt-6">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                <ShieldCheck size={12} className="text-primary" /> {homeOverrides.privacyBadge || tHome("privacyBadge")}
              </div>
            </div>

            {/* Main Heading with Face Seek Branding */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[1.1] tracking-tight uppercase">
              {homeOverrides.heroTitle || t('title')}
            </h1>

            {/* Tagline */}
            <p className="text-slate-400 text-base sm:text-lg md:text-xl font-medium mb-12 max-w-4xl mx-auto leading-relaxed">
              {homeOverrides.heroSubtitle || t('subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              {user ? (
                <>
                  <Button
                    onClick={() => router.push(`/${locale}/search`)}
                    className="h-16 px-10 text-base face-seek-gradient hover:opacity-90 transition-opacity"
                    variant="primary"
                  >
                    <Search className="mr-2" size={20} /> {t('ctaSearch')}
                  </Button>
                  <Button
                    onClick={() => router.push(`/${locale}/dashboard`)}
                    className="h-16 px-10 text-base border-[#00d9ff]/30 bg-[#00d9ff]/5 hover:bg-[#00d9ff]/10"
                    variant="outline"
                  >
                    <BarChart3 className="mr-2" size={20} /> {t('ctaDashboard')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => router.push(`/${locale}/register`)}
                    className="h-16 px-12 text-base face-seek-gradient hover:opacity-90 transition-opacity"
                  >
                    🚀 {t('ctaPrimary')}
                  </Button>
                  <Button
                    onClick={() => router.push(`/${locale}/login`)}
                    className="h-16 px-10 text-base bg-[#00d9ff]/5 border-[#00d9ff]/30 hover:bg-[#00d9ff]/10"
                    variant="outline"
                  >
                    {t('ctaSecondary')}
                  </Button>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
                <Fingerprint size={16} /> {tHome("trust.biometricSecure")}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck size={16} /> {tHome("trust.gdprCompliant")}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
                <Layers size={16} /> {tHome("trust.multiEngine")}
              </div>
            </div>

            {/* Animated Facial Recognition Demo */}
            <div className="mt-20 max-w-2xl mx-auto">
              <FacialRecognitionDemo />
            </div>
          </div>
        </section>

        <div className="px-6 -mt-10">
          <ReferralPromo locale={locale} />
        </div>

        {/* Live Stats Section */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <LiveStats />
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter">{tWhyFaceSeek('title')} <span className="text-primary">{tWhyFaceSeek('titleHighlight')}</span></h2>
              <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <Zap size={32} />, key: 'card1' },
                { icon: <Lock size={32} />, key: 'card2' },
                { icon: <Globe size={32} />, key: 'card3' },
                { icon: <Target size={32} />, key: 'card4' },
                { icon: <ShieldCheck size={32} />, key: 'card5' },
                { icon: <BarChart3 size={32} />, key: 'card6' },
              ].map((f, i) => (
                <GlassCard key={i} className="p-10 group hover:border-primary/50 transition-all duration-500">
                  <div className="text-primary mb-8 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">{f.icon}</div>
                  <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">{tFeatureCards(`${f.key}.title`)}</h3>
                  <p className="text-zinc-500 leading-relaxed font-medium">{tFeatureCards(`${f.key}.desc`)}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Layered UI */}
        <section className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-tighter">{tHowItWorksSection('title')} <span className="text-zinc-700">{tHowItWorksSection('titleGray')}</span></h2>
                <div className="space-y-12">
                  {['step1', 'step2', 'step3', 'step4'].map((stepKey, idx) => (
                    <div key={idx} className="flex gap-8 group">
                      <div className="text-4xl font-black text-zinc-800 transition-colors group-hover:text-primary">{tHowItWorksSection(`${stepKey}.number`)}</div>
                      <div>
                        <h4 className="text-lg font-black text-white uppercase tracking-widest mb-2">{tHowItWorksSection(`${stepKey}.title`)}</h4>
                        <p className="text-zinc-500 font-medium">{tHowItWorksSection(`${stepKey}.desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full"></div>
                <GlassCard className="p-4 border-white/10 shadow-2xl relative z-10" hasScanline>
                  <div className="bg-zinc-950 rounded-2xl overflow-hidden aspect-square flex items-center justify-center border border-white/5">
                    <div className="relative group cursor-crosshair w-full h-full flex items-center justify-center">
                      <div className="absolute inset-x-0 h-0.5 bg-primary/50 shadow-[0_0_15px_var(--color-primary)] animate-[scanline_3s_linear_infinite]"></div>
                      <div className="text-[10px] font-black text-primary/50 uppercase tracking-[0.5em]">
                        {tHome("systemScanning")}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-40 px-6">
          <div className="max-w-5xl mx-auto">
            <GlassCard className="p-20 text-center relative overflow-hidden" hasScanline>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-primary to-transparent"></div>
              <h2 className="text-4xl md:text-7xl font-black text-white mb-8 uppercase tracking-tighter">
                {homeOverrides.ctaTitlePart1 || tCta("titlePart1")}{" "}
                <span className="text-zinc-700">{homeOverrides.ctaTitlePart2 || tCta("titlePart2")}</span>
              </h2>
              <p className="text-zinc-500 text-xl font-medium mb-12 max-w-2xl mx-auto">
                {homeOverrides.ctaDescription || tCta("description")}
              </p>
              {!user && (
                <Button onClick={() => router.push(`/${locale}/register`)} className="h-20 px-12 text-xl shadow-2xl shadow-primary/40">
                  {homeOverrides.ctaButton || tCta("button")} <ArrowRight className="ml-4" size={24} />
                </Button>
              )}
            </GlassCard>
          </div>
        </section>

        {/* Professional Footer */}
        <footer className="py-24 px-6 border-t border-white/5 bg-black/40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
            <div className="flex flex-col items-start max-w-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                  <ShieldCheck size={20} />
                </div>
                <span className="font-black text-2xl tracking-tighter text-white uppercase">FACE<span className="text-primary">SEEK</span></span>
              </div>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">{tFooter("description")}</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{tFooter("systemStatusOnline")}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-24">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{tFooter("product")}</h4>
                <div className="flex flex-col gap-4">
                  <Link href={`/${locale}/search`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("links.faceSearch")}</Link>
                  <Link href={`/${locale}/pricing`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tNav("pricing")}</Link>
                  <Link href={`/${locale}/api`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tNav("enterpriseApi")}</Link>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{tFooter("company")}</h4>
                <div className="flex flex-col gap-4">
                  <Link href={`/${locale}/legal/about`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("links.aboutUs")}</Link>
                  <Link href={`/${locale}/blog`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tNav("blog")}</Link>
                  <a href="mailto:contact@face-seek.com" className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("links.contact")}</a>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{tFooter("legal")}</h4>
                <div className="flex flex-col gap-4">
                  <Link href={`/${locale}/legal`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("links.legalHub")}</Link>
                  <Link href={`/${locale}/legal/privacy`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("privacy")}</Link>
                  <Link href={`/${locale}/legal/kvkk`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("kvkk")}</Link>
                  <Link href={`/${locale}/legal/terms`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("terms")}</Link>
                  <Link href={`/${locale}/legal/disclaimer`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("disclaimer")}</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">{tFooter("copyright")}</p>
            <div className="flex items-center gap-6">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{tFooter("badges.noStoreImages")}</span>
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{tFooter("badges.privacyFirst")}</span>
            </div>
          </div>
        </footer>
      </div>
    </ClientOnly>
  );
}
