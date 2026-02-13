"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSiteConfig } from "@/lib/siteConfig";
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
  Sparkles,
  BadgeCheck,
  Shield,
  Upload,
  Cpu,
  FileSearch,
  ChevronDown,
  Star,
  Quote,
  Eye,
  Users,
  MapPin,
  Clock,
  ImageOff,
  UserSearch,
  ScanEye,
  Gavel,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

/* ─── Inline Sub-components ──────────────────────────────── */

function StatCounter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <div ref={ref} className="text-3xl sm:text-4xl font-black text-white tabular-nums">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

function TrustActivityFeed({ locale }: { locale: string }) {
  const names = useMemo(() =>
    locale === "tr"
      ? ["Mehmet A.", "Ayse K.", "Emre T.", "Fatma D.", "Burak S.", "Zeynep M.", "Ali R.", "Seda Y."]
      : ["James W.", "Maria G.", "Alex K.", "Sarah L.", "David R.", "Emma T.", "Michael B.", "Lisa P."],
    [locale]
  );
  const cities = useMemo(() =>
    locale === "tr"
      ? ["Istanbul", "Ankara", "Izmir", "Antalya", "Bursa"]
      : ["New York", "London", "Berlin", "Tokyo", "Paris"],
    [locale]
  );
  const actionText = locale === "tr" ? "arama tamamladi" : "completed a search";

  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((p) => (p + 1) % names.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, [names.length]);

  const name = names[current];
  const city = cities[current % cities.length];
  const minutes = ((current * 3 + 1) % 12) + 1;

  return (
    <div
      className={`inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 text-xs font-medium transition-all duration-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
    >
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-emerald-300">{name}</span>
      <span className="text-zinc-500">{actionText}</span>
      <span className="text-zinc-600">
        <MapPin size={10} className="inline mr-0.5" />{city} · {minutes}m
      </span>
    </div>
  );
}

function ReviewsCarousel({ locale }: { locale: string }) {
  const reviews = useMemo(() =>
    locale === "tr"
      ? [
        { name: "Ahmet Y.", role: "Siber Güvenlik Uzmanı", text: "FaceSeek, OSINT araştırmalarımda vazgeçilmez bir araç haline geldi. Doğruluk oranı inanılmaz.", rating: 5 },
        { name: "Elif K.", role: "Araştırmacı Gazeteci", text: "Gizlilik odaklı yaklaşımları ile sektörde fark yaratıyorlar. Hızlı ve güvenilir.", rating: 5 },
        { name: "Murat S.", role: "Özel Dedektif", text: "Çoklu motor desteği sayesinde tek bir aramada kapsamlı sonuçlar alıyorum.", rating: 4 },
        { name: "Derya T.", role: "Dijital Forensik Analisti", text: "KVKK ve GDPR uyumlu bir platform bulmak zor. FaceSeek bunu başarıyor.", rating: 5 },
        { name: "Kemal B.", role: "IT Güvenlik Müdürü", text: "Kurumsal API entegrasyonu ile iş akışlarımıza sorunsuz entegre ettik.", rating: 4 },
      ]
      : [
        { name: "James W.", role: "Cybersecurity Analyst", text: "FaceSeek has become an essential tool in my OSINT investigations. The accuracy rate is incredible.", rating: 5 },
        { name: "Sarah L.", role: "Investigative Journalist", text: "Their privacy-focused approach sets them apart. Fast, reliable, and ethical.", rating: 5 },
        { name: "David R.", role: "Private Investigator", text: "Multi-engine support lets me get comprehensive results from a single search.", rating: 4 },
        { name: "Emma T.", role: "Digital Forensics Expert", text: "Finding a GDPR-compliant platform is rare. FaceSeek delivers on privacy.", rating: 5 },
        { name: "Michael B.", role: "IT Security Director", text: "Enterprise API integration was seamless. Great documentation and support.", rating: 4 },
      ],
    [locale]
  );

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIdx((p) => (p + 1) % reviews.length), 5000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  return (
    <div className="relative overflow-hidden">
      <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {reviews.map((r, i) => (
          <div key={i} className="min-w-full px-4">
            <GlassCard className="p-8 md:p-10 text-center">
              <Quote size={28} className="text-primary/30 mx-auto mb-4" />
              <p className="text-zinc-300 text-lg leading-relaxed mb-6 italic">&ldquo;{r.text}&rdquo;</p>
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={14} className={s < r.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"} />
                ))}
              </div>
              <div className="text-white font-bold">{r.name}</div>
              <div className="text-zinc-500 text-sm">{r.role}</div>
            </GlassCard>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-6">
        {reviews.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-primary w-6" : "bg-zinc-700"}`} />
        ))}
      </div>
    </div>
  );
}

function FAQSection({ locale }: { locale: string }) {
  const faqs = useMemo(() =>
    locale === "tr"
      ? [
        { q: "FaceSeek nasıl çalışır?", a: "Yüklediğiniz fotoğraftaki yüzü yapay zeka ile analiz eder, Google, Bing, Yandex ve OSINT veritabanlarında eşzamanlı arama yapar ve eşleşmeleri güven skoru ile raporlar." },
        { q: "Fotoğraflarım saklanıyor mu?", a: "Hayır. Yüklenen görseller işlem tamamlandıktan sonra otomatik olarak silinir. Kalıcı biyometrik veritabanı tutmuyoruz." },
        { q: "KVKK ve GDPR uyumlu mu?", a: "Evet. Platform tamamen KVKK ve GDPR düzenlemelerine uygun olarak tasarlanmıştır. Verileriniz şifrelenir ve izinsiz paylaşılmaz." },
        { q: "Ücretsiz kullanabilir miyim?", a: "Evet. Kayıt olduğunuzda 3 ücretsiz arama hakkı verilir. Daha fazla arama için uygun fiyatlı kredi paketlerimizi inceleyebilirsiniz." },
        { q: "Hangi görüntü formatları destekleniyor?", a: "JPG, PNG, WebP ve BMP formatlarında fotoğraf yükleyebilirsiniz. Maksimum dosya boyutu 10MB'dır." },
        { q: "Sonuçların doğruluk oranı nedir?", a: "Yapay zeka motorumuz %98.7 doğruluk oranı ile çalışır. Her sonuç güven skoru ile birlikte sunulur." },
      ]
      : [
        { q: "How does FaceSeek work?", a: "It analyzes the face in your uploaded photo using AI, searches simultaneously across Google, Bing, Yandex, and OSINT databases, and reports matches with confidence scores." },
        { q: "Are my photos stored?", a: "No. Uploaded images are automatically deleted after processing. We do not maintain a persistent biometric database." },
        { q: "Is FaceSeek GDPR compliant?", a: "Yes. The platform is fully compliant with GDPR and KVKK regulations. Your data is encrypted and never shared without authorization." },
        { q: "Can I use it for free?", a: "Yes. You get 3 free searches upon registration. For more searches, check our affordable credit packages." },
        { q: "What image formats are supported?", a: "You can upload JPG, PNG, WebP, and BMP images. Maximum file size is 10MB." },
        { q: "What is the accuracy rate?", a: "Our AI engine operates at 98.7% accuracy. Each result includes a confidence score for validation." },
      ],
    [locale]
  );

  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <span className="text-white font-semibold pr-4">{faq.q}</span>
            <ChevronDown size={18} className={`text-zinc-500 shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-40 pb-5 px-5" : "max-h-0"}`}>
            <p className="text-zinc-400 leading-relaxed">{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExtendedFAQ() {
  const t = useTranslations('landingFaq');
  const [open, setOpen] = useState<number | null>(null);

  const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

  return (
    <div className="space-y-3">
      {faqKeys.map((key, i) => (
        <div key={key} className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <span className="text-white font-semibold pr-4">{t(`${key}.question`)}</span>
            <ChevronDown size={18} className={`text-zinc-500 shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-40 pb-5 px-5" : "max-h-0"}`}>
            <p className="text-zinc-400 leading-relaxed">{t(`${key}.answer`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

export default function HomeClient({ locale }: { locale: string }) {
  const { user, mounted, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('hero');
  const tFeatureCards = useTranslations('featureCards');
  const tWhyFaceSeek = useTranslations('whyFaceSeek');
  const tHowItWorks = useTranslations('howItWorks');
  const tCommon = useTranslations('common');
  const tHome = useTranslations('home');
  const tCta = useTranslations('cta');
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tLanding = useTranslations('landing');
  const tNewFaq = useTranslations('landingFaq');
  const tTestimonials = useTranslations('testimonials');
  const tReferral = useTranslations('referral');

  const { config: siteConfig } = useSiteConfig(locale);

  const homeOverrides = useMemo(() => {
    const cfg = siteConfig || {};
    return {
      maintenanceMode: !!cfg["site.maintenance_mode"],
      heroBadge: cfg[`home.${locale}.hero_badge`],
      heroTitle: cfg[`home.${locale}.hero_title`],
      heroSubtitle: cfg[`home.${locale}.hero_subtitle`],
      ctaTitlePart1: cfg[`home.${locale}.cta_title_part1`],
      ctaTitlePart2: cfg[`home.${locale}.cta_title_part2`],
      ctaDescription: cfg[`home.${locale}.cta_description`],
      ctaButton: cfg[`home.${locale}.cta_button`],
    };
  }, [siteConfig, locale]);

  const contactEmail = (siteConfig || {})["site.contact_email"] || "benalanx@face-seek.com";

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
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
          <div className="text-4xl font-black text-white uppercase tracking-tight mb-4">{tHome("maintenance.title")}</div>
          <div className="text-zinc-500 text-sm font-medium max-w-xl">{tHome("maintenance.message")}</div>
        </div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-background text-slate-200 selection:bg-primary/30 selection:text-white">
        <Navbar />

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden py-24 px-6 circuit-pattern">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27] via-[#1a1f3a]/50 to-[#0a0e27] pointer-events-none" />
          <div className="absolute inset-0 data-stream opacity-20" />

          {/* Floating dots */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" />
            <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-[#0ea5e9] animate-pulse" style={{ animationDelay: "0.5s" }} />
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" style={{ animationDelay: "1.5s" }} />
          </div>

          <div className="relative max-w-7xl mx-auto text-center z-10">
            {/* Trust Activity Feed */}
            <div className="mb-6">
              <TrustActivityFeed locale={locale} />
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <div className="inline-flex items-center gap-2 bg-[#00d9ff]/10 border border-[#00d9ff]/30 px-3 py-1.5 rounded-full text-[#00d9ff] text-[10px] font-black uppercase tracking-[0.15em]">
                <Lock size={10} /> {tLanding("badges.noStorage")}
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.15em]">
                <ShieldCheck size={10} /> {tLanding("badges.gdpr")}
              </div>
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-full text-purple-400 text-[10px] font-black uppercase tracking-[0.15em]">
                <Fingerprint size={10} /> {tLanding("badges.encrypted")}
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tight uppercase">
              {homeOverrides.heroTitle || t("title")}
            </h1>

            {/* Tagline */}
            <p className="text-slate-400 text-base sm:text-lg md:text-xl font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
              {homeOverrides.heroSubtitle || t("subtitle")}
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <>
                  <Button onClick={() => router.push(`/${locale}/search`)} className="h-14 px-10 text-base face-seek-gradient hover:opacity-90 transition-opacity" variant="primary">
                    <Search className="mr-2" size={18} /> {t("ctaSearch")}
                  </Button>
                  <Button onClick={() => router.push(`/${locale}/dashboard`)} className="h-14 px-10 text-base border-[#00d9ff]/30 bg-[#00d9ff]/5 hover:bg-[#00d9ff]/10" variant="outline">
                    <BarChart3 className="mr-2" size={18} /> {t("ctaDashboard")}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => router.push(`/${locale}/register`)} className="h-14 px-12 text-base face-seek-gradient hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
                    {tLanding("heroCta")} <ArrowRight className="ml-2" size={18} />
                  </Button>
                  <Button onClick={() => router.push(`/${locale}/login`)} className="h-14 px-10 text-base bg-[#00d9ff]/5 border-[#00d9ff]/30 hover:bg-[#00d9ff]/10" variant="outline">
                    {t("ctaSecondary")}
                  </Button>
                </>
              )}
            </div>

            {/* Hero Trust Row */}
            <div className="flex flex-wrap justify-center gap-8 text-zinc-500">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <Fingerprint size={14} className="text-primary/60" /> {tHome("trust.biometricSecure")}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={14} className="text-primary/60" /> {tHome("trust.gdprCompliant")}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <Layers size={14} className="text-primary/60" /> {tHome("trust.multiEngine")}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ STATS BAR ═══ */}
        <section className="py-16 px-6 border-y border-white/5 bg-white/[0.015]">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <StatCounter end={2500000} suffix="+" />
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">{tLanding("stats.totalSearches")}</div>
            </div>
            <div>
              <StatCounter end={98} suffix="%" />
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">{tLanding("stats.accuracy")}</div>
            </div>
            <div>
              <StatCounter end={45000} suffix="+" />
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">{tLanding("stats.activeUsers")}</div>
            </div>
            <div>
              <StatCounter end={120} suffix="+" />
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">{tLanding("stats.countries")}</div>
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                {tLanding("howItWorks.title")}
              </h2>
              <p className="text-zinc-500 text-lg font-medium max-w-xl mx-auto">{tLanding("howItWorks.subtitle")}</p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Upload size={28} />, step: "01", key: "step1" },
                { icon: <Cpu size={28} />, step: "02", key: "step2" },
                { icon: <FileSearch size={28} />, step: "03", key: "step3" },
              ].map((s, i) => (
                <GlassCard key={i} className="p-8 text-center group hover:border-primary/40 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-3 right-4 text-5xl font-black text-white/[0.03]">{s.step}</div>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary group-hover:scale-110 transition-transform">
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-black text-white mb-3 uppercase tracking-wide">{tLanding(`howItWorks.${s.key}.title`)}</h3>
                  <p className="text-zinc-500 leading-relaxed">{tLanding(`howItWorks.${s.key}.desc`)}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ USE CASES — "Kullanıcılar bunu ne için kullanıyor?" ═══ */}
        <section className="py-28 px-6 bg-white/[0.015] border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                {tLanding("useCases.title")}
              </h2>
              <p className="text-zinc-500 text-lg font-medium max-w-xl mx-auto">{tLanding("useCases.subtitle")}</p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <ImageOff size={28} />, key: "case1", color: "from-blue-500/20 to-primary/10" },
                { icon: <UserSearch size={28} />, key: "case2", color: "from-red-500/20 to-orange-500/10" },
                { icon: <ScanEye size={28} />, key: "case3", color: "from-emerald-500/20 to-teal-500/10" },
                { icon: <Shield size={28} />, key: "case4", color: "from-purple-500/20 to-violet-500/10" },
              ].map((c, i) => (
                <GlassCard key={i} className="p-8 text-center group hover:border-primary/40 transition-all duration-500 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary group-hover:scale-110 transition-transform">
                      {c.icon}
                    </div>
                    <h3 className="text-base font-black text-white mb-3 uppercase tracking-wide">{tLanding(`useCases.${c.key}.title`)}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{tLanding(`useCases.${c.key}.desc`)}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURES GRID ═══ */}
        <section className="py-28 px-6 bg-white/[0.015] border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                {tWhyFaceSeek("title")} <span className="text-primary">{tWhyFaceSeek("titleHighlight")}</span>
              </h2>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <Zap size={28} />, key: "card1" },
                { icon: <Lock size={28} />, key: "card2" },
                { icon: <Globe size={28} />, key: "card3" },
                { icon: <Target size={28} />, key: "card4" },
                { icon: <ShieldCheck size={28} />, key: "card5" },
                { icon: <BarChart3 size={28} />, key: "card6" },
              ].map((f, i) => (
                <GlassCard key={i} className="p-8 group hover:border-primary/40 transition-all duration-500">
                  <div className="text-primary mb-6 group-hover:scale-110 transition-transform duration-500">{f.icon}</div>
                  <h3 className="text-lg font-black text-white mb-3 uppercase tracking-tight">{tFeatureCards(`${f.key}.title`)}</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">{tFeatureCards(`${f.key}.desc`)}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PRICING SECTION ═══ */}
        <section className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                {tLanding("pricing.title")}
              </h2>
              <p className="text-zinc-500 text-lg font-medium max-w-xl mx-auto">{tLanding("pricing.subtitle")}</p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Alan Search - Free */}
              <GlassCard className="p-10 group hover:border-primary/40 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-[80px]" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                      <UserSearch size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{tLanding("pricing.alanSearch.title")}</h3>
                  </div>
                  <div className="mb-6">
                    <div className="text-5xl font-black text-emerald-400 mb-2">{tLanding("pricing.alanSearch.price")}</div>
                    <p className="text-zinc-500 text-sm font-medium">{tLanding("pricing.alanSearch.desc")}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{tLanding("pricing.alanSearch.feature1")}</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{tLanding("pricing.alanSearch.feature2")}</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{tLanding("pricing.alanSearch.feature3")}</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => router.push(`/${locale}/register`)}
                    className="w-full h-14 text-base bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-wide"
                  >
                    {tLanding("pricing.button")} <ArrowRight className="ml-2" size={18} />
                  </Button>
                </div>
              </GlassCard>

              {/* Premium Unlimited */}
              <GlassCard className="p-10 group hover:border-primary/40 transition-all duration-500 relative overflow-hidden border-primary/30 ring-1 ring-primary/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-6 py-2 rounded-full uppercase tracking-wider">
                  {locale === "tr" ? "En Popüler" : "Most Popular"}
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[80px]" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                      <Sparkles size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{tLanding("pricing.premium.title")}</h3>
                  </div>
                  <div className="mb-6">
                    <div className="text-5xl font-black text-white mb-1">
                      {locale === "tr" ? tLanding("pricing.premium.priceTry") : tLanding("pricing.premium.priceUsd")}
                    </div>
                    <p className="text-zinc-400 text-sm font-medium">{tLanding("pricing.premium.period")}</p>
                    <p className="text-zinc-500 text-xs mt-2">{tLanding("pricing.premium.desc")}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>{tLanding("pricing.premium.feature1")}</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>{tLanding("pricing.premium.feature2")}</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>{tLanding("pricing.premium.feature3")}</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>{tLanding("pricing.premium.feature4")}</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>{tLanding("pricing.premium.feature5")}</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => router.push(`/${locale}/pricing`)}
                    className="w-full h-14 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-black uppercase tracking-wide shadow-lg shadow-primary/30"
                  >
                    {tLanding("pricing.button")} <ArrowRight className="ml-2" size={18} />
                  </Button>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* ═══ TRUST & COMPLIANCE — KVKK + "veri saklamıyoruz" ═══ */}
        <section className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                {tLanding("trustCompliance.title")}
              </h2>
              <p className="text-zinc-500 text-lg font-medium max-w-xl mx-auto">{tLanding("trustCompliance.subtitle")}</p>
              <div className="w-16 h-1 bg-emerald-500 mx-auto rounded-full mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <ImageOff size={28} />, key: "item1", iconColor: "text-red-400" },
                { icon: <ShieldCheck size={28} />, key: "item2", iconColor: "text-emerald-400" },
                { icon: <Lock size={28} />, key: "item3", iconColor: "text-blue-400" },
                { icon: <Gavel size={28} />, key: "item4", iconColor: "text-amber-400" },
              ].map((item, i) => (
                <GlassCard key={i} className="p-8 group hover:border-emerald-500/40 transition-all duration-500">
                  <div className={`${item.iconColor} mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    {item.icon}
                  </div>
                  <h3 className="text-base font-black text-white mb-3 uppercase tracking-tight">{tLanding(`trustCompliance.${item.key}.title`)}</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">{tLanding(`trustCompliance.${item.key}.desc`)}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ LEGAL ASSURANCE — "Bu yasal mı?" ═══ */}
        <section className="py-28 px-6 bg-white/[0.015] border-y border-white/5">
          <div className="max-w-4xl mx-auto">
            <GlassCard className="p-10 md:p-14 relative overflow-hidden" hasScanline>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-[100px]" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <Gavel size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{tLanding("legalAssurance.title")}</h2>
                    <p className="text-emerald-400 text-sm font-bold uppercase tracking-wide">{tLanding("legalAssurance.subtitle")}</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-base leading-relaxed mb-8">{tLanding("legalAssurance.desc")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {["p1", "p2", "p3", "p4"].map((key) => (
                    <div key={key} className="flex items-start gap-3">
                      <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-zinc-300 text-sm font-medium">{tLanding(`legalAssurance.points.${key}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* ═══ FREE PREVIEW CTA — "Ücretsiz deneme hissi" ═══ */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] p-10 md:p-14 text-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-30" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-black uppercase tracking-wider mb-6">
                  <Sparkles size={14} />
                  {tLanding("freePreview.badge")}
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-white mb-3 uppercase tracking-tight">
                  {tLanding("freePreview.title")}
                </h3>
                <p className="text-white/80 text-base font-medium mb-4 max-w-xl mx-auto">
                  {tLanding("freePreview.subtitle")}
                </p>
                <p className="text-white/60 text-sm mb-8 max-w-md mx-auto">
                  {tLanding("freePreview.desc")}
                </p>
                {/* Blur preview mockup */}
                <div className="max-w-xs mx-auto mb-8 rounded-xl overflow-hidden border border-white/20">
                  <div className="bg-white/10 backdrop-blur-sm p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 blur-[6px]" />
                      <div className="flex-1">
                        <div className="h-3 w-24 bg-white/20 rounded blur-[4px] mb-1" />
                        <div className="h-2 w-16 bg-white/10 rounded blur-[4px]" />
                      </div>
                      <div className="text-xs font-bold text-white/80 bg-emerald-500/30 px-2 py-1 rounded">87%</div>
                    </div>
                    <div className="text-[10px] text-white/50 text-center">{tLanding("freePreview.blurNote")}</div>
                  </div>
                </div>
                {!user && (
                  <Button
                    onClick={() => router.push(`/${locale}/register`)}
                    className="h-14 px-12 text-base bg-white text-purple-600 hover:bg-white/90 font-black uppercase tracking-wide shadow-lg"
                    variant="outline"
                  >
                    {tLanding("freePreview.button")} <ArrowRight className="ml-2" size={18} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ REVIEWS ═══ */}
        <section className="py-28 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                {tLanding("reviews.title")}
              </h2>
              <p className="text-zinc-500 text-lg font-medium">{tLanding("reviews.subtitle")}</p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-6" />
            </div>
            <ReviewsCarousel locale={locale} />
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="py-28 px-6 bg-white/[0.015] border-y border-white/5">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                {tLanding("faq.title")}
              </h2>
              <p className="text-zinc-500 text-lg font-medium">{tLanding("faq.subtitle")}</p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-6" />
            </div>
            <FAQSection locale={locale} />
          </div>
        </section>

        {/* ═══ EXTENDED FAQ ═══ */}
        <section className="py-28 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                {tNewFaq("title")}
              </h2>
              <p className="text-zinc-500 text-lg font-medium">{tNewFaq("subtitle")}</p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-6" />
            </div>
            <ExtendedFAQ />
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section className="py-28 px-6 bg-white/[0.015] border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
                {tTestimonials("title")}
              </h2>
              <p className="text-zinc-500 text-lg font-medium">{tTestimonials("subtitle")}</p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { nameKey: "person1.name", roleKey: "person1.role", quoteKey: "person1.quote", rating: 5 },
                { nameKey: "person2.name", roleKey: "person2.role", quoteKey: "person2.quote", rating: 5 },
                { nameKey: "person3.name", roleKey: "person3.role", quoteKey: "person3.quote", rating: 4 },
              ].map((t_item, i) => (
                <GlassCard key={i} className="p-8 text-center group hover:border-primary/40 transition-all duration-500">
                  <Quote size={24} className="text-primary/30 mx-auto mb-4" />
                  <p className="text-zinc-300 text-sm leading-relaxed mb-6 italic">
                    &ldquo;{tTestimonials(t_item.quoteKey)}&rdquo;
                  </p>
                  <div className="flex justify-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={14} className={s < t_item.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"} />
                    ))}
                  </div>
                  <div className="text-white font-bold text-sm">{tTestimonials(t_item.nameKey)}</div>
                  <div className="text-zinc-500 text-xs mt-1">{tTestimonials(t_item.roleKey)}</div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ REFERRAL CTA BANNER ═══ */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-10 md:p-14 text-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-30" />
              <div className="relative z-10">
                <Users size={36} className="text-white/80 mx-auto mb-4" />
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-tight">
                  {tReferral("title")}
                </h3>
                <p className="text-white/80 text-base font-medium mb-8 max-w-xl mx-auto">
                  {tReferral("description")}
                </p>
                <Button
                  onClick={() => router.push(`/${locale}/register`)}
                  className="h-14 px-10 text-base bg-white text-amber-600 hover:bg-white/90 font-black uppercase tracking-wide shadow-lg"
                  variant="outline"
                >
                  {tReferral("button")} <ArrowRight className="ml-2" size={18} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <GlassCard className="p-12 md:p-16 text-center relative overflow-hidden" hasScanline>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-primary to-transparent" />
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight">
                {homeOverrides.ctaTitlePart1 || tCta("titlePart1")}{" "}
                <span className="text-zinc-700">{homeOverrides.ctaTitlePart2 || tCta("titlePart2")}</span>
              </h2>
              <p className="text-zinc-500 text-lg font-medium mb-8 max-w-2xl mx-auto">
                {homeOverrides.ctaDescription || tCta("description")}
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <span className="flex items-center gap-1.5"><Lock size={10} className="text-primary/60" /> {tLanding("finalCta.secure")}</span>
                <span className="flex items-center gap-1.5"><Eye size={10} className="text-primary/60" /> {tLanding("finalCta.private")}</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={10} className="text-primary/60" /> {tLanding("finalCta.compliant")}</span>
              </div>
              {!user && (
                <Button onClick={() => router.push(`/${locale}/register`)} className="h-16 px-12 text-lg shadow-2xl shadow-primary/30">
                  {homeOverrides.ctaButton || tCta("button")} <ArrowRight className="ml-3" size={20} />
                </Button>
              )}
            </GlassCard>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="py-20 px-6 border-t border-white/5 bg-black/40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="flex flex-col items-start max-w-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                  <ShieldCheck size={18} />
                </div>
                <span className="font-black text-xl tracking-tighter text-white uppercase">FACE<span className="text-primary">SEEK</span></span>
              </div>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-6">{tFooter("description")}</p>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{tFooter("systemStatusOnline")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 sm:gap-20">
              <div className="space-y-5">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{tFooter("product")}</h4>
                <div className="flex flex-col gap-3">
                  <Link href={`/${locale}/search`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("links.faceSearch")}</Link>
                  <Link href={`/${locale}/pricing`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tNav("pricing")}</Link>
                  <Link href={`/${locale}/api`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tNav("enterpriseApi")}</Link>
                </div>
              </div>
              <div className="space-y-5">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{tFooter("company")}</h4>
                <div className="flex flex-col gap-3">
                  <Link href={`/${locale}/legal/about`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("links.aboutUs")}</Link>
                  <Link href={`/${locale}/blog`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tNav("blog")}</Link>
                  <a href={`mailto:${contactEmail}`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("links.contact")}</a>
                </div>
              </div>
              <div className="space-y-5">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{tFooter("legal")}</h4>
                <div className="flex flex-col gap-3">
                  <Link href={`/${locale}/legal`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("links.legalHub")}</Link>
                  <Link href={`/${locale}/legal/privacy`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("privacy")}</Link>
                  <Link href={`/${locale}/legal/kvkk`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("kvkk")}</Link>
                  <Link href={`/${locale}/legal/terms`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">{tFooter("terms")}</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-16 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
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
