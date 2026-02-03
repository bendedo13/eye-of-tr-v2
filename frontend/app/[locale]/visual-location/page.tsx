"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { analyzeVisualLocation, VisualLocationAPIError, VisualSimilarityLocationReport } from "@/lib/visualLocation";
import { use } from "react";
import { ExternalLink, MapPin, ShieldCheck, Upload } from "lucide-react";


type UiTheme = "dark" | "light";

export default function VisualLocationPage({
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
  const [report, setReport] = useState<VisualSimilarityLocationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [mounted, loading, user, router, locale]);

  const copy = useMemo(() => {
    if (locale === "tr") {
      return {
        title: "FACESEEK GÖRSEL BENZERLİK & KONUM",
        subtitle: "İNTERNET EŞLEŞMELERİ + MATEMATİKSEL BENZERLİK SKORU",
        uploadTitle: "GÖRSEL YÜKLE",
        uploadHint: "JPG, PNG, WEBP • MAX 10MB",
        consentText:
          "Bu analizin tahmine dayalı olduğunu, sonuçların kesinlik içermeyebileceğini, tüm sorumluluğun bana ait olduğunu kabul ediyorum.",
        start: "ANALİZİ BAŞLAT",
        change: "DEĞİŞTİR",
        results: "RAPOR",
        predicted: "TAHMİNİ KONUM",
        matches: "EŞLEŞMELER",
        compliance: "KURAL UYGUNLUĞU",
        openMaps: "HARİTADA AÇ",
        openSource: "KAYNAĞI AÇ",
        themeDark: "DARK",
        themeLight: "LIGHT",
      };
    }
    return {
      title: "FACESEEK VISUAL SIMILARITY & LOCATION",
      subtitle: "INTERNET MATCHES + MATHEMATICAL SIMILARITY SCORE",
      uploadTitle: "UPLOAD IMAGE",
      uploadHint: "JPG, PNG, WEBP • MAX 10MB",
      consentText:
        "I acknowledge this analysis is predictive, may be inaccurate, and I accept full responsibility for any outcomes.",
      start: "START ANALYSIS",
      change: "CHANGE",
      results: "REPORT",
      predicted: "PREDICTED LOCATION",
      matches: "MATCHES",
      compliance: "COMPLIANCE",
      openMaps: "OPEN IN MAPS",
      openSource: "OPEN SOURCE",
      themeDark: "DARK",
      themeLight: "LIGHT",
    };
  }, [locale]);

  const themeClasses = useMemo(() => {
    if (uiTheme === "light") {
      return {
        page: "min-h-screen bg-white text-zinc-900",
        title: "text-zinc-900",
        muted: "text-zinc-600",
        dashed: "border-black/20 hover:border-primary/40",
      };
    }
    return {
      page: "min-h-screen bg-background text-slate-200",
      title: "text-white",
      muted: "text-zinc-500",
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
    setReport(null);
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
    setReport(null);
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
    setReport(null);
    try {
      const data = await analyzeVisualLocation({ token, file, consent: acceptedConsent });
      setReport(data);
    } catch (e) {
      const err = e as VisualLocationAPIError;
      if (err.statusCode === 402) {
        toast.error(locale === "tr" ? "Krediniz bitti. Fiyatlandırmaya yönlendiriliyorsunuz." : "Out of credits. Redirecting to pricing.");
        router.push(`/${locale}/pricing`);
        return;
      }
      setError(err.message || (locale === "tr" ? "Analiz başarısız" : "Analysis failed"));
    } finally {
      setAnalyzing(false);
    }
  };

  const mapsHref = useMemo(() => {
    const p = report?.predicted_location;
    if (!p) return null;
    if (typeof p.latitude !== "number" || typeof p.longitude !== "number") return null;
    return `https://www.google.com/maps?q=${encodeURIComponent(`${p.latitude},${p.longitude}`)}`;
  }, [report]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">
          Initializing Visual Engine...
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
          <div className="flex items-start justify-between gap-6 flex-col md:flex-row mb-12">
            <div className="space-y-4">
              <h1 className={`text-3xl md:text-5xl font-black tracking-tighter uppercase ${themeClasses.title}`}>
                {copy.title}
              </h1>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 ${themeClasses.muted}`}>
                <ShieldCheck size={16} className="text-primary" /> {copy.subtitle}
              </p>
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
            </div>
          </div>

          {error && (
            <div className="max-w-3xl mx-auto mb-10 bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl">
              <div className="text-rose-500 text-[11px] font-black uppercase tracking-widest">{error}</div>
            </div>
          )}

          <GlassCard className="max-w-5xl mx-auto p-10 md:p-12 mb-14" hasScanline>
            {!preview ? (
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="visual-file-upload"
                />
                <label
                  htmlFor="visual-file-upload"
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[40px] p-16 md:p-24 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group ${themeClasses.dashed}`}
                >
                  <div className="w-24 h-24 bg-primary/20 rounded-[32px] flex items-center justify-center text-primary mb-8 shadow-2xl shadow-primary/20 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <Upload size={40} />
                  </div>
                  <h3 className={`text-2xl font-black mb-3 uppercase tracking-tight ${themeClasses.title}`}>{copy.uploadTitle}</h3>
                  <p className={`text-xs font-bold uppercase tracking-[0.2em] ${themeClasses.muted}`}>{copy.uploadHint}</p>
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
                      {copy.start}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">
                      {locale === "tr" ? "ZORUNLU ONAY" : "REQUIRED CONSENT"}
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
                    <a
                      href={`/${locale}/legal/disclaimer`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                    >
                      {locale === "tr" ? "SORUMLULUK BEYANINI OKU" : "READ DISCLAIMER"}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {report && !analyzing && (
            <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                  {locale === "tr" ? "ZORUNLU İBARE" : "MANDATORY NOTICE"}
                </div>
                <div className="mt-2 text-xs text-amber-200/90 leading-relaxed">{report.mandatory_notice}</div>
              </div>

              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-6 gap-4 flex-col md:flex-row">
                  <div className="space-y-2 w-full">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{copy.predicted}</div>
                    <div className="text-white font-black text-lg flex items-center gap-2">
                      <MapPin className="text-primary" size={18} />
                      {[
                        report.predicted_location.country,
                        report.predicted_location.city,
                        report.predicted_location.district,
                        report.predicted_location.neighborhood,
                      ]
                        .filter(Boolean)
                        .join(" • ") || (locale === "tr" ? "Bilinmiyor" : "Unknown")}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {typeof report.predicted_location.latitude === "number" && typeof report.predicted_location.longitude === "number"
                        ? `${report.predicted_location.latitude.toFixed(6)}, ${report.predicted_location.longitude.toFixed(6)}`
                        : (locale === "tr" ? "Koordinat bulunamadı" : "No coordinates")}
                    </div>
                    {!!report.location_sources?.length && (
                      <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {locale === "tr" ? "Konum Kaynakları:" : "Location Sources:"}{" "}
                        <span className="text-zinc-300">
                          {Array.from(new Set(report.location_sources.map((s) => s.source))).join(" • ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {mapsHref && (
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                      >
                        {copy.openMaps} <ExternalLink size={14} className="inline-block ml-1" />
                      </a>
                    )}
                    <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                      {Math.round(report.confidence_0_1 * 100)}% {locale === "tr" ? "GÜVEN" : "CONF"}
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-8">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">{copy.compliance}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-zinc-300">
                    consent_required: <span className="text-white font-black">{String(report.compliance.consent_required)}</span>
                    <br />
                    consent_received: <span className="text-white font-black">{String(report.compliance.consent_received)}</span>
                    <br />
                    images_stored: <span className="text-white font-black">{String(report.compliance.images_stored)}</span>
                    <br />
                    credits_consumed: <span className="text-white font-black">{report.compliance.credits_consumed}</span>
                    {!!report.compliance.trace_id && (
                      <>
                        <br />
                        trace_id: <span className="text-white font-black">{report.compliance.trace_id}</span>
                      </>
                    )}
                    {!!report.compliance.ab_variant && (
                      <>
                        <br />
                        ab_variant: <span className="text-white font-black">{report.compliance.ab_variant}</span>
                      </>
                    )}
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-zinc-300">
                    providers_used:
                    <div className="mt-2 flex flex-wrap gap-2">
                      {report.compliance.providers_used.length ? (
                        report.compliance.providers_used.map((p) => (
                          <span key={p} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-black text-primary uppercase">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500">{locale === "tr" ? "Yok" : "None"}</span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-8">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">{copy.matches}</div>
                <div className="space-y-3">
                  {report.matches.slice(0, 10).map((m, idx) => (
                    <div key={`${idx}-${m.provider}-${m.source_url ?? "none"}`} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-white font-black truncate">{m.title || m.source_url || m.provider}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
                          {m.provider} • {Math.round(m.similarity_percent)}% • {Math.round(m.confidence_0_1 * 100)}%
                        </div>
                      </div>
                      {m.source_url && (
                        <a
                          href={m.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                        >
                          {copy.openSource} <ExternalLink size={14} className="inline-block ml-1" />
                        </a>
                      )}
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
