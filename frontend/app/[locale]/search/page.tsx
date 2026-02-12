"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import AdvancedSearchModal, {
  AdvancedSearchParams,
} from "@/components/AdvancedSearchModal";
import { advancedSearchFace } from "@/lib/api";
import {
  Upload,
  Search,
  RotateCcw,
  ShieldCheck,
  Zap,
  AlertCircle,
  ExternalLink,
  Target,
  Globe,
  ArrowRight,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { use } from "react";

/* ─── Scanning Animation ─────────────────────── */
function ScanningOverlay({ tSearch }: { tSearch: (key: string) => string }) {
  const [phase, setPhase] = useState(0);
  const phases = [
    tSearch("scanning"),
    tSearch("analyzing"),
    tSearch("matching"),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % phases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [phases.length]);

  return (
    <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm rounded-[32px] flex flex-col items-center justify-center">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-2 border-4 border-transparent border-b-[#8b5cf6] rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Target size={24} className="text-primary animate-pulse" />
        </div>
      </div>
      <div className="text-white font-black text-sm uppercase tracking-widest mb-2">
        {phases[phase]}
      </div>
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
      </div>
    </div>
  );
}

export default function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params) as { locale: string };
  const isTR = locale === "tr";
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();
  const tSearch = useTranslations("search");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeFacecheck, setIncludeFacecheck] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "/api"
  ).replace(/\/+$/, "");
  const resolveUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (!url.startsWith("/")) return url;
    if (apiBase.endsWith("/api") && url.startsWith("/api/")) {
      return `${apiBase}${url.slice(4)}`;
    }
    return `${apiBase}${url}`;
  };

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [mounted, loading, user, router, locale]);

  const processFile = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error(tSearch("fileTooLarge"));
      return;
    }
    setFile(selectedFile);
    setError(null);
    setAcceptedDisclaimer(false);
    setAcceptedLegal(false);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      processFile(droppedFile);
    }
  };

  const handleChangeImage = () => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setError(null);
    setAcceptedDisclaimer(false);
    setAcceptedLegal(false);
  };

  const canSearch = acceptedDisclaimer && acceptedLegal && !searching;

  const handleSearch = async () => {
    if (!file || !token) {
      toast.error(tSearch("selectPhoto"));
      return;
    }
    if (!acceptedDisclaimer || !acceptedLegal) {
      toast.error(tSearch("acceptFirst"));
      return;
    }

    setSearching(true);
    setResults(null);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const searchRes = await fetch(
        `${apiBase}/search-face?top_k=3&include_facecheck=${includeFacecheck ? "true" : "false"}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      if (searchRes.status === 402) {
        toast.error(tSearch("creditsOut"));
        router.push(`/${locale}/pricing`);
        return;
      }
      const searchData = await searchRes.json();
      if (!searchRes.ok)
        throw new Error(searchData.detail || "Search failed");
      setResults(searchData);
    } catch (err: any) {
      setError(err.message || tSearch("searchFailed"));
      toast.error(tSearch("systemError"));
    } finally {
      setSearching(false);
    }
  };

  const handleAdvancedSearch = async (params: AdvancedSearchParams) => {
    if (!file || !token) {
      toast.error(tSearch("selectPhoto"));
      return;
    }
    setSearching(true);
    setResults(null);
    setError(null);
    setShowAdvancedModal(false);
    setIsAdvancedSearch(true);

    try {
      const searchData = await advancedSearchFace(token, file, {
        ...params,
        include_facecheck: includeFacecheck,
      });
      setResults(searchData);
    } catch (err: any) {
      if (err.statusCode === 402) {
        toast.error(tSearch("creditsOut"));
        router.push(`/${locale}/pricing`);
        return;
      }
      setError(err.message || tSearch("searchFailed"));
      toast.error(tSearch("systemError"));
    } finally {
      setSearching(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">
          {tSearch("initializing")}
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
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter uppercase whitespace-pre-line">
              {tSearch("title")}{" "}
              <span className="text-zinc-700">{tSearch("titleGray")}</span>{" "}
              <span className="text-primary">{tSearch("titlePrimary")}</span>
            </h1>
            <p className="text-zinc-500 text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
              <ShieldCheck size={16} className="text-primary" />{" "}
              {tSearch("subtitle")}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-xl mx-auto mb-10 bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex items-center gap-4 animate-in zoom-in duration-300">
              <AlertCircle className="text-rose-500 flex-shrink-0" size={24} />
              <p className="text-rose-500 text-[11px] font-black uppercase tracking-widest">
                {error}
              </p>
            </div>
          )}

          {/* Upload Section */}
          <GlassCard className="max-w-3xl mx-auto p-12 mb-16 relative" hasScanline>
            {!preview ? (
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[40px] p-20 transition-all cursor-pointer group ${dragOver
                    ? "border-primary/60 bg-primary/10"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/40"
                    }`}
                >
                  <div className="w-20 h-20 bg-primary/20 rounded-[28px] flex items-center justify-center text-primary mb-6 shadow-2xl shadow-primary/20 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <Upload size={36} />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
                    {tSearch("uploadTitle")}
                  </h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                    {tSearch("uploadFormats")}
                  </p>
                  {/* Quality Tips */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] font-medium text-amber-300/70 mb-4">
                    <Info size={12} className="shrink-0" />
                    {tSearch("qualityTips")}
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                    <ShieldCheck size={14} className="text-primary" />{" "}
                    {tSearch("uploadPrivacy")}
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative max-w-sm mx-auto group">
                  <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all" />
                  <div className="relative rounded-[32px] overflow-hidden border-2 border-primary/40 shadow-2xl">
                    <img
                      src={preview}
                      alt="Target Preview"
                      className="w-full aspect-square object-cover"
                    />
                    {searching && (
                      <ScanningOverlay tSearch={tSearch} />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 max-w-md mx-auto">
                  <div className="flex gap-4">
                    <Button
                      onClick={handleChangeImage}
                      variant="outline"
                      className="flex-1 h-14 bg-white/5 border-white/5 hover:bg-white/10"
                      disabled={searching}
                    >
                      <RotateCcw className="mr-2" size={18} />{" "}
                      {tSearch("changeImage")}
                    </Button>
                    <Button
                      onClick={handleSearch}
                      className="flex-1 h-14"
                      isLoading={searching}
                      disabled={!canSearch}
                    >
                      <Target className="mr-2" size={18} />{" "}
                      {tSearch("startScan")}
                    </Button>
                  </div>

                  <Button
                    onClick={() => setShowAdvancedModal(true)}
                    variant="outline"
                    className="w-full h-14 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50 hover:bg-primary/20"
                    disabled={searching}
                  >
                    <Sliders className="mr-2" size={18} />
                    {tSearch("advancedSearch")}
                    <span className="ml-auto text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-primary/20 rounded-full border border-primary/40">
                      {tSearch("advancedCredits")}
                    </span>
                  </Button>

                  <div className="text-center text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                    {tSearch("creditInfo")}
                  </div>
                </div>

                {/* Legal Confirmations */}
                <div className="flex flex-col items-center justify-center gap-3 pt-2 max-w-md mx-auto">
                  <label className="flex items-start gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={acceptedDisclaimer}
                      onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                      className="accent-primary mt-0.5 shrink-0"
                      disabled={searching}
                    />
                    <span className="leading-relaxed">{tSearch("disclaimer")}</span>
                  </label>
                  <label className="flex items-start gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={acceptedLegal}
                      onChange={(e) => setAcceptedLegal(e.target.checked)}
                      className="accent-primary mt-0.5 shrink-0"
                      disabled={searching}
                    />
                    <span className="leading-relaxed">{tSearch("legalConfirm")}</span>
                  </label>
                  <a
                    href={`/${locale}/legal/disclaimer`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                  >
                    {tSearch("readDisclaimer")}
                  </a>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Results Section */}
          {results && !searching && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-white/5 p-8 rounded-[32px] border border-white/5">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                    {tSearch("resultsTitle")}{" "}
                    <span className="text-zinc-700">{tSearch("resultsGray")}</span>
                  </h2>
                  <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                    <Zap size={12} className="text-primary" />{" "}
                    {results.total_matches || 0} {tSearch("matchesFound")}
                  </p>
                </div>
                <div className="h-10 w-[1px] bg-white/5 hidden md:block" />
                <div className="flex gap-4">
                  <div className="text-right">
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">
                      {tSearch("providers")}
                    </div>
                    <div className="flex gap-2">
                      {results.providers_used?.map((p: string) => (
                        <span
                          key={p}
                          className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-black text-primary uppercase"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Explanation */}
              {results.ai_explanation && (
                <div className="mb-12 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-[32px] p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                      <Sparkles size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-3">
                        {tSearch("aiAnalysis")}
                      </h3>
                      <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                        {results.ai_explanation}
                      </p>
                      <div className="mt-4 text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={12} /> {tSearch("aiDisclaimer")}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {results.matches && results.matches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {results.matches.map((match: any, i: number) => (
                    <GlassCard
                      key={i}
                      className={`group hover:border-primary/40 transition-all duration-500 ${match.blurred ? "relative overflow-hidden" : ""}`}
                    >
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors">
                            {match.platform === "google" ? (
                              <Globe size={24} />
                            ) : match.platform === "local_crew" ? (
                              <Target size={24} className="text-primary" />
                            ) : (
                              <Search size={24} />
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-white tracking-tighter">
                              {Math.round(match.confidence * 100 || 0)}%
                            </div>
                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                              {tSearch("confidence")}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`space-y-4 ${match.blurred ? "blur-md grayscale pointer-events-none" : ""}`}
                        >
                          <div className="aspect-square rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden">
                            {match.image_url && (
                              <img
                                src={resolveUrl(match.image_url)}
                                alt="Result"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight truncate">
                              {match.username ||
                                match.title ||
                                tSearch("unknown")}
                            </h3>
                            <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">
                              {tSearch("source")}:{" "}
                              {match.platform === "local_crew"
                                ? isTR ? "YEREL VERI" : "LOCAL CREW"
                                : match.platform
                                  ? match.platform.toUpperCase()
                                  : "WEB"}
                            </p>
                            {match.metadata?.description && (
                              <p className="text-zinc-400 text-xs mt-2 line-clamp-3">
                                {match.metadata.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {match.blurred ? (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-2xl shadow-primary/20">
                              <AlertCircle size={32} />
                            </div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2 text-center">
                              {tSearch("contentProtected")}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-bold text-center mb-8">
                              {tSearch("contentProtectedDesc")}
                            </p>
                            <Button
                              onClick={() =>
                                router.push(`/${locale}/pricing`)
                              }
                              className="h-12 w-full text-[10px]"
                            >
                              {tSearch("buyCredits")}{" "}
                              <ArrowRight className="ml-2" size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-8 pt-8 border-t border-white/5">
                            <button
                              onClick={() => {
                                const url = resolveUrl(match.profile_url);
                                if (url) window.open(url, "_blank");
                              }}
                              className="w-full h-14 bg-white/5 hover:bg-primary text-zinc-400 hover:text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/5 hover:border-primary/50"
                            >
                              {tSearch("viewProfile")}{" "}
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <>
                  {results.error_message ? (
                    <GlassCard className="p-12 text-center max-w-2xl mx-auto border-primary/20 bg-primary/5">
                      <div className="w-20 h-20 bg-primary/20 rounded-[28px] flex items-center justify-center text-primary mx-auto mb-8 shadow-[0_0_40px_rgba(0,217,255,0.2)]">
                        <ShieldCheck size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">
                        {tSearch("privacyProtocol")}
                      </h3>
                      <p className="text-zinc-300 text-sm font-medium leading-relaxed mb-8">
                        {results.error_message}
                      </p>
                      <div className="flex justify-center">
                        <div className="px-4 py-2 bg-black/40 rounded-lg border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                          Code: PRIVACY_BLOCK_ACTIVE
                        </div>
                      </div>
                    </GlassCard>
                  ) : (
                    <GlassCard className="p-20 text-center max-w-2xl mx-auto">
                      <div className="w-20 h-20 bg-zinc-800 rounded-[28px] flex items-center justify-center text-zinc-600 mx-auto mb-8">
                        <Search size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">
                        {tSearch("noMatch")}
                      </h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                        {tSearch("noMatchDesc")}
                      </p>
                    </GlassCard>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <AdvancedSearchModal
          isOpen={showAdvancedModal}
          onClose={() => setShowAdvancedModal(false)}
          onSearch={handleAdvancedSearch}
          isSearching={searching}
        />
      </div>
    </ClientOnly>
  );
}
