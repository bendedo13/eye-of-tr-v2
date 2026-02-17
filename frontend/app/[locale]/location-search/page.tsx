"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { analyzeLocationSearch, LocationSearchAPIError, LocationSearchResponse } from "@/lib/locationSearch";
import { me } from "@/lib/api";
import { use } from "react";
import {
    Camera,
    Clock,
    Compass,
    Crosshair,
    ExternalLink,
    Eye,
    Lock,
    MapPin,
    Mountain,
    Navigation,
    Radar,
    ScanLine,
    ShieldCheck,
    Sparkles,
    Upload,
} from "lucide-react";


export default function LocationSearchPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    const { user, token, mounted, loading } = useAuth();
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [acceptedConsent, setAcceptedConsent] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<LocationSearchResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analyzeProgress, setAnalyzeProgress] = useState(0);
    const [analyzeStep, setAnalyzeStep] = useState("");

    useEffect(() => {
        if (mounted && !loading && !user) {
            router.push(`/${locale}/login`);
        }
    }, [mounted, loading, user, router, locale]);

    const copy = useMemo(() => {
        if (locale === "tr") {
            return {
                title: "KONUM",
                titleAccent: "ARAMA",
                subtitle: "FOTOĞRAF EXIF VERİLERİNDEN KONUM TESPİTİ",
                uploadTitle: "FOTOĞRAF YÜKLE",
                uploadHint: "JPG, PNG, WEBP • MAX 10MB",
                noStore: "Fotoğraflar saklanmıyor",
                consentText:
                    "Bu analizin EXIF metadata'ya dayalı olduğunu, sonuçların kesinlik içermeyebileceğini ve tüm sorumluluğun bana ait olduğunu kabul ediyorum.",
                consentCta: "ZORUNLU ONAY",
                start: "KONUM ANALİZİNİ BAŞLAT",
                change: "DEĞİŞTİR",
                readDisclaimer: "SORUMLULUK BEYANINI OKU",
                creditInfo: "1 ANALİZ = 1 KREDİ",
                creditBody: "Her yeni kullanıcı 1 ücretsiz konum arama hakkına sahiptir.",
                creditCta: "FİYATLANDIRMAYA GİT",
                regionNote: "Bu modül fotoğrafların EXIF GPS verilerini analiz eder.",
                steps: [
                    "EXIF verileri okunuyor...",
                    "GPS koordinatları aranıyor...",
                    "Kamera bilgileri çıkarılıyor...",
                    "Konum hesaplanıyor...",
                    "Reverse geocoding yapılıyor...",
                    "Rapor oluşturuluyor...",
                ],
                // Result labels
                resultTitle: "KONUM ANALİZ RAPORU",
                gpsFound: "GPS VERİSİ TESPİT EDİLDİ",
                gpsNotFound: "GPS VERİSİ BULUNAMADI",
                country: "Ülke",
                city: "Şehir",
                coordinates: "Koordinatlar",
                confidence: "Güven Skoru",
                camera: "Kamera",
                timestamp: "Çekim Tarihi",
                altitude: "Yükseklik",
                direction: "Yön",
                dataPoints: "Veri Noktası",
                openMaps: "HARİTADA AÇ",
                mandatoryNotice: "ZORUNLU İBARE",
                // Preview / blur
                unlockTitle: "DETAYLI RAPOR",
                unlockBody: "Tam koordinatlar, adres detayları ve harita görünümü için premium erişim gereklidir.",
                unlockCta: "DETAYLI RAPORU AÇ",
                dataFound: "veri noktası tespit edildi",
                blurredLabel: "GİZLENMİŞ",
                noGpsSuggestion: "GPS özelliği açık bir cihazla çekilmiş fotoğraflar daha doğru sonuç verir.",
            };
        }
        return {
            title: "LOCATION",
            titleAccent: "SEARCH",
            subtitle: "LOCATION DETECTION FROM PHOTO EXIF DATA",
            uploadTitle: "UPLOAD PHOTO",
            uploadHint: "JPG, PNG, WEBP • MAX 10MB",
            noStore: "Photos are not stored",
            consentText:
                "I acknowledge this analysis is based on EXIF metadata, may be inaccurate, and I accept full responsibility for any outcomes.",
            consentCta: "REQUIRED CONSENT",
            start: "START LOCATION ANALYSIS",
            change: "CHANGE",
            readDisclaimer: "READ DISCLAIMER",
            creditInfo: "1 ANALYSIS = 1 CREDIT",
            creditBody: "Each new user receives 1 free location search credit.",
            creditCta: "GO TO PRICING",
            regionNote: "This module analyzes EXIF GPS data from photographs.",
            steps: [
                "Reading EXIF data...",
                "Searching GPS coordinates...",
                "Extracting camera info...",
                "Calculating location...",
                "Running reverse geocoding...",
                "Generating report...",
            ],
            resultTitle: "LOCATION ANALYSIS REPORT",
            gpsFound: "GPS DATA DETECTED",
            gpsNotFound: "NO GPS DATA FOUND",
            country: "Country",
            city: "City",
            coordinates: "Coordinates",
            confidence: "Confidence",
            camera: "Camera",
            timestamp: "Capture Date",
            altitude: "Altitude",
            direction: "Direction",
            dataPoints: "Data Points",
            openMaps: "OPEN IN MAPS",
            mandatoryNotice: "MANDATORY NOTICE",
            unlockTitle: "DETAILED REPORT",
            unlockBody: "Full coordinates, address details and map view require premium access.",
            unlockCta: "UNLOCK FULL REPORT",
            dataFound: "data points detected",
            blurredLabel: "HIDDEN",
            noGpsSuggestion: "Photos taken with GPS-enabled devices produce more accurate results.",
        };
    }, [locale]);

    // Loading animation steps
    useEffect(() => {
        if (!analyzing) {
            setAnalyzeProgress(0);
            setAnalyzeStep("");
            return;
        }
        let step = 0;
        const totalSteps = copy.steps.length;
        const interval = setInterval(() => {
            step++;
            if (step <= totalSteps) {
                setAnalyzeProgress(Math.round((step / totalSteps) * 100));
                setAnalyzeStep(copy.steps[step - 1]);
            }
        }, 600);
        return () => clearInterval(interval);
    }, [analyzing, copy.steps]);

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
            toast.error(locale === "tr" ? "Lütfen bir fotoğraf seçin." : "Please select a photo.");
            return;
        }
        if (!acceptedConsent) {
            toast.error(locale === "tr" ? "Onay verilmeden analiz başlatılamaz." : "Consent is required.");
            return;
        }

        setAnalyzing(true);
        setError(null);
        setResult(null);
        try {
            const data = await analyzeLocationSearch({ token, file, consent: acceptedConsent });
            setResult(data);
            me(token).catch(() => undefined);
        } catch (e) {
            const err = e as LocationSearchAPIError;
            if (err.statusCode === 402) {
                toast.error(
                    locale === "tr"
                        ? "Konum arama krediniz bitti. Fiyatlandırma sayfasına yönlendiriliyorsunuz."
                        : "Out of credits. Redirecting to pricing."
                );
                router.push(`/${locale}/pricing`);
                return;
            }
            setError(err.message || (locale === "tr" ? "Analiz başarısız" : "Analysis failed"));
        } finally {
            setAnalyzing(false);
        }
    };

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
            <div className="min-h-screen bg-background text-slate-200">
                <Navbar />

                <div className="max-w-6xl mx-auto px-6 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-6 flex-col md:flex-row mb-14">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white">
                                {copy.title} <span className="text-primary">{copy.titleAccent}</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-zinc-500">
                                <Radar size={16} className="text-primary" /> {copy.subtitle}
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                                <Sparkles size={14} className="text-primary" /> {copy.regionNote}
                            </div>
                        </div>

                        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                            {user.tier === "unlimited" ? "∞" : (user.credits ?? 0)} {locale === "tr" ? "KREDİ" : "CREDITS"}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="max-w-3xl mx-auto mb-10 bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl">
                            <div className="text-rose-500 text-[11px] font-black uppercase tracking-widest">{error}</div>
                        </div>
                    )}

                    {/* Upload Card */}
                    <GlassCard className="max-w-4xl mx-auto p-10 md:p-12 mb-14" hasScanline>
                        {!preview ? (
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="location-search-upload"
                                />
                                <label
                                    htmlFor="location-search-upload"
                                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-[40px] p-16 md:p-24 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group border-white/5 hover:border-primary/40"
                                >
                                    <div className="w-24 h-24 bg-primary/20 rounded-[32px] flex items-center justify-center text-primary mb-8 shadow-2xl shadow-primary/20 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                        <Upload size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-3 uppercase tracking-tight text-white">{copy.uploadTitle}</h3>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{copy.uploadHint}</p>
                                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                                        <ShieldCheck size={14} className="text-primary" /> {copy.noStore}
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                                {/* Preview Image */}
                                <div className="space-y-6">
                                    <div className="relative max-w-sm mx-auto group">
                                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all"></div>
                                        <div className="relative rounded-[32px] overflow-hidden border-2 border-primary/40 shadow-2xl">
                                            <img src={preview} alt="Preview" className="w-full aspect-square object-cover" />
                                            {analyzing && (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                                    {/* Orbital loading animation */}
                                                    <div className="relative w-28 h-28 mb-6">
                                                        <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                                                        <div className="absolute inset-2 border-2 border-transparent border-t-primary rounded-full animate-spin"></div>
                                                        <div className="absolute inset-4 border-2 border-transparent border-b-cyan-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }}></div>
                                                        <div className="absolute inset-6 border-2 border-transparent border-l-purple-400 rounded-full animate-spin" style={{ animationDuration: "2s" }}></div>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Radar size={24} className="text-primary animate-pulse" />
                                                        </div>
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${analyzeProgress}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">
                                                        {analyzeStep}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
                                                        {analyzeProgress}%
                                                    </div>
                                                </div>
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
                                            <ScanLine className="mr-2" size={18} /> {copy.start}
                                        </Button>
                                    </div>
                                </div>

                                {/* Consent + Credit info */}
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
                                                {copy.creditInfo}
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm text-zinc-400">
                                            {copy.creditBody}
                                            <button
                                                onClick={() => router.push(`/${locale}/pricing`)}
                                                className="ml-2 text-primary font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                                            >
                                                {copy.creditCta}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    {/* ═══════ RESULTS ═══════ */}
                    {result && !analyzing && (
                        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                            {/* Result Header Badge */}
                            <div className="flex items-center justify-between gap-4 flex-col md:flex-row bg-white/5 border border-white/10 rounded-[32px] p-8">
                                <div className="space-y-2">
                                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">
                                        {copy.resultTitle}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${result.gps_found
                                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                                : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                                            }`}>
                                            <MapPin size={12} />
                                            {result.gps_found ? copy.gpsFound : copy.gpsNotFound}
                                        </div>
                                    </div>
                                </div>

                                {/* Confidence Ring */}
                                {result.gps_found && (
                                    <div className="relative w-24 h-24">
                                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                            <circle
                                                cx="50" cy="50" r="42" fill="none"
                                                stroke="url(#confGrad)"
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                                strokeDasharray={`${((result.preview?.confidence ?? result.result?.confidence ?? 0) / 100) * 264} 264`}
                                            />
                                            <defs>
                                                <linearGradient id="confGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="var(--color-primary)" />
                                                    <stop offset="100%" stopColor="#06b6d4" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div className="text-lg font-black text-white">
                                                {result.preview?.confidence ?? result.result?.confidence ?? 0}%
                                            </div>
                                            <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{copy.confidence}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ──── GPS FOUND: Preview (blurred) or Full ──── */}
                            {result.gps_found && result.is_preview && result.preview && (
                                <>
                                    {/* Blurred preview result — creates curiosity */}
                                    <div className="relative overflow-hidden rounded-[32px] border border-white/10">
                                        {/* Background glow */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5"></div>

                                        <div className="relative p-8 md:p-10">
                                            {/* Data points badge */}
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                                        <Eye size={18} className="text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-black text-lg">{result.preview.data_points_found} {copy.dataFound}</div>
                                                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">EXIF METADATA</div>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-widest">
                                                    {copy.blurredLabel}
                                                </div>
                                            </div>

                                            {/* Data grid — partially blurred */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                                {/* Country — visible */}
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                                        <MapPin size={18} className="text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{copy.country}</div>
                                                        <div className="text-white font-black text-lg truncate">{result.preview.country || "—"}</div>
                                                    </div>
                                                </div>

                                                {/* City — blurred */}
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                                        <Compass size={18} className="text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{copy.city}</div>
                                                        <div className="text-white font-black text-lg blur-[6px] select-none">{result.preview.city_hint || "Büyük Şehir"}</div>
                                                    </div>
                                                    <Lock size={14} className="absolute top-3 right-3 text-zinc-600" />
                                                </div>

                                                {/* Coordinates — blurred */}
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
                                                    <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center shrink-0">
                                                        <Crosshair size={18} className="text-cyan-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{copy.coordinates}</div>
                                                        <div className="text-white font-black text-sm blur-[6px] select-none font-mono">
                                                            {result.preview.latitude_hint}, {result.preview.longitude_hint}
                                                        </div>
                                                    </div>
                                                    <Lock size={14} className="absolute top-3 right-3 text-zinc-600" />
                                                </div>

                                                {/* Camera model — visible teaser */}
                                                {result.preview.camera_model && (
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0">
                                                            <Camera size={18} className="text-purple-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{copy.camera}</div>
                                                            <div className="text-white font-black truncate">{result.preview.camera_model}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Extra data indicators */}
                                            <div className="flex flex-wrap gap-3 mb-8">
                                                {result.preview.timestamp_found && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                                                        <Clock size={14} className="text-primary" />
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{copy.timestamp}</span>
                                                        <span className="text-emerald-400 text-[10px] font-black">✓</span>
                                                    </div>
                                                )}
                                                {result.preview.altitude_found && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                                                        <Mountain size={14} className="text-cyan-400" />
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{copy.altitude}</span>
                                                        <span className="text-emerald-400 text-[10px] font-black">✓</span>
                                                    </div>
                                                )}
                                                {result.preview.direction_found && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                                                        <Navigation size={14} className="text-purple-400" />
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{copy.direction}</span>
                                                        <span className="text-emerald-400 text-[10px] font-black">✓</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Teaser message */}
                                            <div className="bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/20 rounded-2xl p-6 text-center">
                                                <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">{copy.unlockTitle}</div>
                                                <p className="text-zinc-300 text-sm mb-5 max-w-lg mx-auto leading-relaxed">
                                                    {result.teaser_message || copy.unlockBody}
                                                </p>
                                                <Button
                                                    onClick={() => router.push(`/${locale}/pricing`)}
                                                    className="h-12 px-8 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 transition-opacity text-black font-black uppercase tracking-wide"
                                                >
                                                    <Lock size={16} className="mr-2" /> {result.unlock_cta || copy.unlockCta}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ──── GPS FOUND: Full result ──── */}
                            {result.gps_found && !result.is_preview && result.result && (
                                <div className="space-y-6">
                                    {/* Location data grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <GlassCard className="p-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{copy.coordinates}</div>
                                                <a
                                                    href={result.result.maps_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                                                >
                                                    {copy.openMaps} <ExternalLink size={12} />
                                                </a>
                                            </div>
                                            <div className="space-y-3">
                                                {[
                                                    { k: copy.country, v: result.result.country || "—", icon: <MapPin size={16} className="text-primary" /> },
                                                    { k: copy.city, v: result.result.city || "—", icon: <Compass size={16} className="text-cyan-400" /> },
                                                    { k: copy.coordinates, v: `${result.result.latitude.toFixed(6)}, ${result.result.longitude.toFixed(6)}`, icon: <Crosshair size={16} className="text-emerald-400" /> },
                                                ].map((row) => (
                                                    <div key={row.k} className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {row.icon}
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{row.k}</div>
                                                        </div>
                                                        <div className="text-sm font-black text-white">{row.v}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </GlassCard>

                                        <GlassCard className="p-8">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">{copy.dataPoints}</div>
                                            <div className="space-y-3">
                                                {result.result.camera_model && (
                                                    <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Camera size={16} className="text-purple-400" />
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{copy.camera}</div>
                                                        </div>
                                                        <div className="text-sm font-black text-white">{result.result.camera_model}</div>
                                                    </div>
                                                )}
                                                {result.result.timestamp && (
                                                    <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Clock size={16} className="text-primary" />
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{copy.timestamp}</div>
                                                        </div>
                                                        <div className="text-sm font-black text-white">{result.result.timestamp}</div>
                                                    </div>
                                                )}
                                                {result.result.altitude !== null && (
                                                    <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Mountain size={16} className="text-cyan-400" />
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{copy.altitude}</div>
                                                        </div>
                                                        <div className="text-sm font-black text-white">{result.result.altitude?.toFixed(1)}m</div>
                                                    </div>
                                                )}
                                                {result.result.direction !== null && (
                                                    <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Navigation size={16} className="text-purple-400" />
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{copy.direction}</div>
                                                        </div>
                                                        <div className="text-sm font-black text-white">{result.result.direction?.toFixed(1)}°</div>
                                                    </div>
                                                )}
                                            </div>
                                        </GlassCard>
                                    </div>
                                </div>
                            )}

                            {/* ──── NO GPS DATA ──── */}
                            {!result.gps_found && result.preview && (
                                <GlassCard className="p-8 md:p-10">
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
                                            <MapPin size={28} className="text-amber-400" />
                                        </div>
                                        <div className="text-white font-black text-xl uppercase">{copy.gpsNotFound}</div>
                                        <p className="text-zinc-400 max-w-md mx-auto">{result.preview.message || copy.noGpsSuggestion}</p>

                                        {(result.preview.camera_model || result.preview.timestamp) && (
                                            <div className="pt-4 flex flex-wrap gap-3 justify-center">
                                                {result.preview.camera_model && (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                                        <Camera size={14} className="text-purple-400" />
                                                        <span className="text-xs font-bold text-zinc-300">{result.preview.camera_model}</span>
                                                    </div>
                                                )}
                                                {result.preview.timestamp && (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                                        <Clock size={14} className="text-primary" />
                                                        <span className="text-xs font-bold text-zinc-300">{result.preview.timestamp}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pt-2">{result.preview.suggestion || copy.noGpsSuggestion}</p>
                                    </div>
                                </GlassCard>
                            )}

                            {/* Mandatory Notice */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                                <div className="text-[10px] font-black uppercase tracking-widest text-amber-200">{copy.mandatoryNotice}</div>
                                <div className="mt-2 text-xs text-amber-200/90 leading-relaxed">{result.mandatory_notice}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ClientOnly>
    );
}
