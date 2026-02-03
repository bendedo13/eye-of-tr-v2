"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { analyzeLocationIntelligence, LocationIntelligenceAPIError, LocationIntelligenceResult } from "@/lib/locationIntelligence";
import { me } from "@/lib/api";
import { use } from "react";
import { Compass, Crosshair, MapPin, ShieldCheck, Sparkles, Upload } from "lucide-react";


type UiTheme = "dark" | "light";

export default function LocationIntelligencePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();

  const [uiTheme, setUiTheme] = useState<UiTheme>("dark");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [acceptedConsent, setAcceptedConsent] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<LocationIntelligenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditsSnapshot, setCreditsSnapshot] = useState<number | null>(null);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [mounted, loading, user, router, locale]);

  useEffect(() => {
    if (mounted && user && creditsSnapshot === null) {
      setCreditsSnapshot(user.credits ?? 0);
    }
  }, [mounted, user, creditsSnapshot]);

  const copy = useMemo(() => {
    if (locale === "tr") {
      return {
        titleTop: "FACESEEK",
        titleBottom: "KONUM ZEKÂSI",
        subtitle: "ÇEVRESEL İPUÇLARINDAN TAHMİNSEL KONUM ANALİZİ",
        uploadTitle: "GÖRSEL YÜKLE",
        uploadHint: "JPG, PNG, WEBP • MAX 10MB",
        noStore: "We don’t store images",
        consentText:
          "Bu analizin tahmine dayalı olduğunu, sonuçların kesinlik içermeyebileceğini, tüm sorumluluğun bana ait olduğunu kabul ediyorum.",
        consentCta: "ZORUNLU ONAY",
        start: "ANALİZİ BAŞLAT",
        change: "DEĞİŞTİR",
        results: "SONUÇ",
        predictedLocation: "TAHMİNİ KONUM",
        analysis: "AÇIKLAMALI ANALİZ",
        factors: "NEYE GÖRE TAHMİN EDİLDİ",
        confidence: "GÜVEN",
        upsellTitle: "KREDİ GEREKLİ",
        upsellBody: "Bu analiz 1 kredi tüketir. Kredi bittiğinde analiz başlatılamaz.",
        upsellCta: "FİYATLANDIRMAYA GİT",
        readDisclaimer: "SORUMLULUK BEYANINI OKU",
        themeDark: "DARK",
        themeLight: "LIGHT",
        regionNote: "Bu modül yüz/kimlik analizi yapmaz; yalnızca ortama bakar.",
      };
    }
    return {
      titleTop: "FACESEEK",
      titleBottom: "LOCATION INTELLIGENCE",
      subtitle: "PREDICTIVE LOCATION ANALYSIS FROM ENVIRONMENTAL CLUES",
      uploadTitle: "UPLOAD IMAGE",
      uploadHint: "JPG, PNG, WEBP • MAX 10MB",
      noStore: "We don’t store images",
      consentText:
        "I acknowledge this analysis is predictive, may be inaccurate, and I accept full responsibility for any outcomes.",
      consentCta: "REQUIRED CONSENT",
      start: "START ANALYSIS",
      change: "CHANGE",
      results: "RESULT",
      predictedLocation: "PREDICTED LOCATION",
      analysis: "EXPLAINED ANALYSIS",
      factors: "WHAT THE PREDICTION USED",
      confidence: "CONFIDENCE",
      upsellTitle: "CREDITS REQUIRED",
      upsellBody: "This analysis consumes 1 credit. If you’re out of credits, analysis cannot start.",
      upsellCta: "GO TO PRICING",
      readDisclaimer: "READ DISCLAIMER",
      themeDark: "DARK",
      themeLight: "LIGHT",
      regionNote: "This module does not identify faces; it only analyzes the environment.",
    };
  }, [locale]);

  const themeClasses = useMemo(() => {
    if (uiTheme === "light") {
      return {
        page: "min-h-screen bg-white text-zinc-900",
        title: "text-zinc-900",
        muted: "text-zinc-600",
        card: "bg-black/[0.02] border border-black/10",
        dashed: "border-black/20 hover:border-primary/40",
      };
    }
    return {
      page: "min-h-screen bg-background text-slate-200",
      title: "text-white",
      muted: "text-zinc-500",
      card: "",
      dashed: "border-white/5 hover:border-primary/40",
    };
  }, [uiTheme]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error(locale === "tr" ? "Dosya boyutu 10MB'den küçük olmalı" : "File must be under 10MB");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setResult(null);
    setAcceptedConsent(false);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setAcceptedConsent(false);
    setAnalyzing(false);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!token || !file) {
      toast.error(locale === "tr" ? "Lütfen bir görsel seçin." : "Please select an image.");
      return;
    }
    if (!acceptedConsent) {
      toast.error(locale === "tr" ? "Onay verilmeden analiz başlatılamaz." : "Consent is required to start analysis.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeLocationIntelligence({ token, file, consent: acceptedConsent });
      setResult(data);
      if (user && user.tier !== "unlimited" && creditsSnapshot !== null) {
        setCreditsSnapshot(Math.max(0, creditsSnapshot - 1));
      }
      me(token).catch(() => undefined);
    } catch (e) {
      const err = e as LocationIntelligenceAPIError;
      if (err.statusCode === 402) {
        toast.error(locale === "tr" ? "Krediniz bitti. Fiyatlandırma sayfasına yönlendiriliyorsunuz." : "Out of credits. Redirecting to pricing.");
        router.push(`/${locale}/pricing`);
        return;
      }
      if (err.statusCode === 400) {
        setError(locale === "tr" ? "Zorunlu onay olmadan analiz başlatılamaz." : "Consent is required.");
      } else {
        setError(err.message || (locale === "tr" ? "Analiz başarısız" : "Analysis failed"));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const locationLines = useMemo(() => {
    const p = result?.predicted_location;
    if (!p) return [];
    const safe = (v: string | null | undefined) => (v && v.trim().length ? v : (locale === "tr" ? "Bilinmiyor" : "Unknown"));
    const lines: Array<{ k: string; v: string }> = [
      { k: locale === "tr" ? "Ülke" : "Country", v: safe(p.country) },
      { k: locale === "tr" ? "Şehir" : "City", v: safe(p.city) },
      { k: locale === "tr" ? "İlçe" : "District", v: safe(p.district) },
      { k: locale === "tr" ? "Mahalle" : "Neighborhood", v: safe(p.neighborhood) },
    ];
    const hasCoords = typeof p.latitude === "number" && typeof p.longitude === "number";
    lines.push({
      k: locale === "tr" ? "Koordinat" : "Coordinates",
      v: hasCoords ? `${p.latitude!.toFixed(6)}, ${p.longitude!.toFixed(6)}` : (locale === "tr" ? "Bilinmiyor" : "Unknown"),
    });
    return lines;
  }, [result, locale]);

  const mapsHref = useMemo(() => {
    const p = result?.predicted_location;
    if (!p) return null;
    if (typeof p.latitude !== "number" || typeof p.longitude !== "number") return null;
    return `https://www.google.com/maps?q=${encodeURIComponent(`${p.latitude},${p.longitude}`)}`;
  }, [result]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">
          Initializing Location Engine...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ClientOnly>
      <div className={themeClasses.page}>
        <Navbar />

        <div className="max-w-6xl mx-auto px-6 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-start justify-between gap-6 flex-col md:flex-row mb-14">
            <div className="space-y-4">
              <h1 className={`text-4xl md:text-6xl font-black tracking-tighter uppercase ${themeClasses.title}`}>
                {copy.titleTop} <span className="text-primary">{copy.titleBottom}</span>
              </h1>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 ${themeClasses.muted}`}>
                <ShieldCheck size={16} className="text-primary" /> {copy.subtitle}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                <Sparkles size={14} className="text-primary" /> {copy.regionNote}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
                <button
                  onClick={() => setUiTheme("dark")}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${uiTheme === "dark" ? "bg-primary text-black" : "text-zinc-500 hover:text-white"}`}
                >
                  {copy.themeDark}
                </button>
                <button
                  onClick={() => setUiTheme("light")}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${uiTheme === "light" ? "bg-primary text-black" : "text-zinc-500 hover:text-white"}`}
                >
                  {copy.themeLight}
                </button>
              </div>

              <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                {user.tier === "unlimited" ? "∞" : (creditsSnapshot ?? user.credits ?? 0)} {locale === "tr" ? "KREDİ" : "CREDITS"}
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-3xl mx-auto mb-10 bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl">
              <div className="text-rose-500 text-[11px] font-black uppercase tracking-widest">{error}</div>
            </div>
          )}

          <GlassCard className={`max-w-4xl mx-auto p-10 md:p-12 mb-14 ${themeClasses.card}`} hasScanline>
            {!preview ? (
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="location-file-upload"
                />
                <label
                  htmlFor="location-file-upload"
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[40px] p-16 md:p-24 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group ${themeClasses.dashed}`}
                >
                  <div className="w-24 h-24 bg-primary/20 rounded-[32px] flex items-center justify-center text-primary mb-8 shadow-2xl shadow-primary/20 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <Upload size={40} />
                  </div>
                  <h3 className={`text-2xl font-black mb-3 uppercase tracking-tight ${themeClasses.title}`}>{copy.uploadTitle}</h3>
                  <p className={`text-xs font-bold uppercase tracking-[0.2em] ${themeClasses.muted}`}>{copy.uploadHint}</p>
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                    <ShieldCheck size={14} className="text-primary" /> {copy.noStore}
                  </div>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="space-y-6">
                  <div className="relative max-w-sm mx-auto group">
                    <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all"></div>
                    <div className="relative rounded-[32px] overflow-hidden border-2 border-primary/40 shadow-2xl">
                      <img src={preview} alt="Preview" className="w-full aspect-square object-cover" />
                      {analyzing && (
                        <div className="absolute inset-x-0 h-1 bg-primary/80 shadow-[0_0_20px_var(--color-primary)] animate-[scanline_2s_linear_infinite]"></div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 max-w-sm mx-auto">
                    <Button
                      onClick={reset}
                      variant="outline"
                      className="flex-1 h-14 bg-white/5 border-white/5 hover:bg-white/10"
                      disabled={analyzing}
                    >
                      {copy.change}
                    </Button>
                    <Button
                      onClick={handleAnalyze}
                      className="flex-1 h-14"
                      isLoading={analyzing}
                      disabled={analyzing || !acceptedConsent}
                    >
                      <Compass className="mr-2" size={18} /> {copy.start}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">{copy.consentCta}</div>
                      <a
                        href={`/${locale}/legal/disclaimer`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                      >
                        {copy.readDisclaimer}
                      </a>
                    </div>
                    <label className="flex items-start gap-3 text-xs font-bold leading-relaxed text-zinc-300">
                      <input
                        type="checkbox"
                        checked={acceptedConsent}
                        onChange={(e) => setAcceptedConsent(e.target.checked)}
                        className="accent-primary mt-1"
                        disabled={analyzing}
                      />
                      <span>{copy.consentText}</span>
                    </label>
                  </div>

                  <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
                    <div className="flex items-center gap-3">
                      <Crosshair className="text-primary" size={18} />
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                        {locale === "tr" ? "1 ANALİZ = 1 KREDİ" : "1 ANALYSIS = 1 CREDIT"}
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-zinc-400">
                      {copy.upsellBody}
                      <button
                        onClick={() => router.push(`/${locale}/pricing`)}
                        className="ml-2 text-primary font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                      >
                        {copy.upsellCta}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {result && !analyzing && (
            <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between gap-4 flex-col md:flex-row bg-white/5 border border-white/10 rounded-[32px] p-8">
                <div className="space-y-2">
                  <h2 className={`text-2xl md:text-3xl font-black uppercase tracking-tighter ${themeClasses.title}`}>
                    {copy.results}
                  </h2>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                    <MapPin size={14} className="text-primary" /> {copy.predictedLocation}
                  </div>
                </div>

                <div className="w-full md:w-[320px]">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                    <span>{copy.confidence}</span>
                    <span className="text-primary">{Math.round(result.confidence)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.max(0, Math.min(100, result.confidence))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{copy.predictedLocation}</div>
                    {mapsHref && (
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                      >
                        {locale === "tr" ? "HARİTADA AÇ" : "OPEN IN MAPS"}
                      </a>
                    )}
                  </div>
                  <div className="space-y-3">
                    {locationLines.map((l) => (
                      <div key={l.k} className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{l.k}</div>
                        <div className={`text-sm font-black ${themeClasses.title}`}>{l.v}</div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-8">
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">{copy.analysis}</div>
                  <div className={`text-sm leading-relaxed ${uiTheme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>
                    {result.analysis}
                  </div>
                  <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                      {locale === "tr" ? "ZORUNLU İBARE" : "MANDATORY NOTICE"}
                    </div>
                    <div className="mt-2 text-xs text-amber-200/90 leading-relaxed">{result.mandatory_notice}</div>
                  </div>
                </GlassCard>
              </div>

              <GlassCard className="p-8">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">{copy.factors}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.factors.map((f, i) => (
                    <div key={`${i}-${f}`} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
                        {i + 1}
                      </div>
                      <div className="text-xs text-zinc-300 font-bold leading-relaxed">{f}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
