"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Github,
  Youtube,
  ExternalLink,
  Coins,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Globe,
  MessageCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { computeBlurIndices } from "@/helpers/searchUtils";

/* ─── Types ──────────────────────────────────── */

interface Platform {
  id: string;
  name: string;
  icon: string;
}

interface SearchResult {
  platform: string;
  platform_name: string;
  query_url: string;
  icon: string;
}

/* ─── Platform Icon Map ──────────────────────── */

const PLATFORM_ICON_MAP: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-5 h-5" />,
  twitter: <Twitter className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  facebook: <Facebook className="w-5 h-5" />,
  github: <Github className="w-5 h-5" />,
  reddit: <MessageCircle className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
};

const PLATFORM_COLOR_MAP: Record<string, string> = {
  linkedin: "from-blue-600 to-blue-700",
  twitter: "from-sky-500 to-sky-600",
  instagram: "from-pink-500 to-purple-600",
  facebook: "from-blue-500 to-blue-600",
  github: "from-gray-600 to-gray-700",
  reddit: "from-orange-500 to-orange-600",
  youtube: "from-red-500 to-red-600",
};

const PLATFORM_BORDER_MAP: Record<string, string> = {
  linkedin: "border-blue-500/40 hover:border-blue-400/60",
  twitter: "border-sky-500/40 hover:border-sky-400/60",
  instagram: "border-pink-500/40 hover:border-pink-400/60",
  facebook: "border-blue-500/40 hover:border-blue-400/60",
  github: "border-gray-500/40 hover:border-gray-400/60",
  reddit: "border-orange-500/40 hover:border-orange-400/60",
  youtube: "border-red-500/40 hover:border-red-400/60",
};

/* ─── Default Platforms ──────────────────────── */

const DEFAULT_PLATFORMS: Platform[] = [
  { id: "linkedin", name: "LinkedIn", icon: "linkedin" },
  { id: "twitter", name: "Twitter", icon: "twitter" },
  { id: "instagram", name: "Instagram", icon: "instagram" },
  { id: "facebook", name: "Facebook", icon: "facebook" },
  { id: "github", name: "GitHub", icon: "github" },
  { id: "reddit", name: "Reddit", icon: "reddit" },
  { id: "youtube", name: "YouTube", icon: "youtube" },
];

/* ─── Component ──────────────────────────────── */

export default function AlanSearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();

  const isTR = locale === "tr";

  /* ── Translations ─────────────────────────── */
  const t: Record<string, string> = isTR
    ? {
      title: "Alan Arama",
      subtitle: "Sosyal medya platformlarında kişi arama",
      credits: "Kredi",
      creditsRemaining: "Kalan Kredi",
      noCredits: "Krediniz kalmadı",
      buyCredits: "Daha fazla sonuç ve sınırsız erişim için kredi satın alın.",
      goToPricing: "Kredi Satın Al",
      searchPlaceholder: "Kişi adını girin...",
      selectPlatforms: "Platformları Seçin",
      selectAll: "Tümünü Seç",
      deselectAll: "Tümünü Kaldır",
      search: "Ara",
      searching: "Aranıyor...",
      results: "Sonuçlar",
      noResults: "Sonuç bulunamadı",
      openInGoogle: "Google'da Aç",
      loginRequired: "Bu özelliği kullanmak için giriş yapın",
      login: "Giriş Yap",
      errorFetch: "Veri yüklenirken hata oluştu",
      errorSearch: "Arama sırasında hata oluştu",
      enterName: "Lütfen bir isim girin",
      selectAtLeastOne: "En az bir platform seçin",
      creditsUsed: "Kullanılan kredi",
      remainingAfter: "Kalan kredi",
      platformsLabel: "Platformlar",
      queryLabel: "Aranan Kişi",
      loadingStep1: "Sunucuya bağlanılıyor...",
      loadingStep2: "Sosyal medya platformları taranıyor...",
      loadingStep3: "Profil verileri derleniyor...",
      loadingStep4: "Yapay zeka analizi yapılıyor...",
      loadingStep5: "Sonuçlar hazırlanıyor...",
      loadingTeaser: "Detaylı analiz sürüyor, lütfen bekleyin",
    }
    : {
      title: "AlanSearch",
      subtitle: "Search for people across social media platforms",
      credits: "Credits",
      creditsRemaining: "Credits Remaining",
      noCredits: "No credits remaining",
      buyCredits: "Visit the pricing page to purchase more credits",
      goToPricing: "Pricing",
      searchPlaceholder: "Enter person name...",
      selectPlatforms: "Select Platforms",
      selectAll: "Select All",
      deselectAll: "Deselect All",
      search: "Search",
      searching: "Searching...",
      results: "Results",
      noResults: "No results found",
      openInGoogle: "Open in Google",
      loginRequired: "Please log in to use this feature",
      login: "Log In",
      errorFetch: "Error loading data",
      errorSearch: "Error during search",
      enterName: "Please enter a name",
      selectAtLeastOne: "Select at least one platform",
      creditsUsed: "Credits used",
      remainingAfter: "Credits remaining",
      platformsLabel: "Platforms",
      queryLabel: "Searched Person",
      loadingStep1: "Connecting to servers...",
      loadingStep2: "Scanning social media platforms...",
      loadingStep3: "Compiling profile data...",
      loadingStep4: "Running AI analysis...",
      loadingStep5: "Preparing results...",
      loadingTeaser: "Deep analysis in progress, please wait",
    };

  /* ── State ────────────────────────────────── */
  const [credits, setCredits] = useState<number | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>(DEFAULT_PLATFORMS);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(DEFAULT_PLATFORMS.map((p) => p.id))
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewRatio, setPreviewRatio] = useState(0);
  const [redirectToPricing, setRedirectToPricing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const requestIdRef = useRef(0);
  const lastTriggerRef = useRef(0);

  /* ── Auth redirect ────────────────────────── */
  useEffect(() => {
    if (mounted && !loading && !user) {
      // Don't redirect, show login prompt instead
    }
  }, [mounted, loading, user]);

  /* ── Fetch credits & platforms ────────────── */
  useEffect(() => {
    if (!mounted || !token) return;

    const fetchData = async () => {
      try {
        const [creditsData, platformsData] = await Promise.all([
          api.get<{ credits: number }>("/api/alan-search/credits", { token }),
          api.get<{ platforms: Platform[] }>("/api/alan-search/platforms", { token }).catch(() => null),
        ]);
        setCredits(creditsData.credits);
        if (platformsData?.platforms && platformsData.platforms.length > 0) {
          setPlatforms(platformsData.platforms);
          setSelectedPlatforms(new Set(platformsData.platforms.map((p) => p.id)));
        }
      } catch {
        setError(t.errorFetch);
      }
    };

    fetchData();
  }, [mounted, token]);

  /* ── Handlers ─────────────────────────────── */
  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(new Set(platforms.map((p) => p.id)));
  };

  const deselectAllPlatforms = () => {
    setSelectedPlatforms(new Set());
  };

  const loadingSteps = [
    t.loadingStep1,
    t.loadingStep2,
    t.loadingStep3,
    t.loadingStep4,
    t.loadingStep5,
  ];

  const handleSearch = async () => {
    setError(null);

    if (!user || !token) {
      router.push(`/${locale}/login`);
      return;
    }

    const now = Date.now();
    if (now - lastTriggerRef.current < 1200 || isSearching) {
      return;
    }
    lastTriggerRef.current = now;
    const myRequestId = ++requestIdRef.current;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError(t.enterName);
      return;
    }

    if (selectedPlatforms.size === 0) {
      setError(t.selectAtLeastOne);
      return;
    }

    setIsSearching(true);
    setOverlayVisible(true);
    setResults([]);
    setHasSearched(false);
    setPreviewMode(false);
    setPreviewRatio(0);
    setRedirectToPricing(false);
    setLoadingStep(0);
    setLoadingProgress(0);

    // Staged loading animation — minimum 12 seconds
    const TOTAL_DURATION = 12000; // 12 seconds
    const STEP_COUNT = 5;
    const STEP_DURATION = TOTAL_DURATION / STEP_COUNT; // 2.4s each

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < STEP_COUNT - 1) return prev + 1;
        return prev;
      });
    }, STEP_DURATION);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev < 95) return prev + 1;
        return prev;
      });
    }, TOTAL_DURATION / 95);

    const startTime = Date.now();

    try {
      const data = await api.post<{
        status: string;
        query: string;
        credits_remaining: number;
        has_credit: boolean;
        blurred: boolean;
        redirect_to_pricing: boolean;
        preview_ratio?: number;
        results: SearchResult[];
      }>(
        "/api/alan-search/search",
        {
          query: trimmedQuery,
          platforms: Array.from(selectedPlatforms),
        },
        { token }
      );

      // Wait until minimum duration has passed
      const elapsed = Date.now() - startTime;
      const remaining = TOTAL_DURATION - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      clearInterval(stepInterval);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingStep(STEP_COUNT - 1);

      // Brief pause at 100%
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (myRequestId === requestIdRef.current) {
        setResults(data.results || []);
        setCreditsRemaining(data.credits_remaining);
        setCredits(data.credits_remaining);
        setHasSearched(true);
        setPreviewMode(Boolean(data.blurred));
        setPreviewRatio(
          data.preview_ratio != null ? data.preview_ratio : data.blurred ? 0.6 : 0
        );
        setRedirectToPricing(Boolean(data.redirect_to_pricing));
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      if (err?.statusCode === 402) {
        setError(t.noCredits);
      } else {
        setError(err?.message || t.errorSearch);
      }
    } finally {
      if (myRequestId === requestIdRef.current) {
        setIsSearching(false);
        setOverlayVisible(false);
        setLoadingProgress(0);
        setLoadingStep(0);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching) {
      handleSearch();
    }
  };

  /* ── Render ───────────────────────────────── */
  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />

        {/* Fullscreen Search Overlay */}
        {overlayVisible && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-spin" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-1 rounded-full border-2 border-purple-500/30 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              <div className="absolute inset-2 rounded-full border-2 border-cyan-400/40 animate-spin" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div className="text-cyan-400 font-black text-sm uppercase tracking-widest">{t.searching}</div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                <Globe className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {t.title}
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </motion.div>

          {/* ── Not Logged In ── */}
          {mounted && !loading && !user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="max-w-lg mx-auto p-8 text-center">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">
                  {t.loginRequired}
                </h2>
                <button
                  onClick={() => router.push(`/${locale}/login`)}
                  className="mt-4 px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white transition-all"
                >
                  {t.login}
                </button>
              </GlassCard>
            </motion.div>
          )}

          {/* ── Main Content (Logged In) ── */}
          {user && token && (
            <div className="space-y-8">
              {/* ── Credits Badge ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex justify-center"
              >
                <GlassCard className="inline-flex items-center gap-3 px-6 py-3">
                  <Coins className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 text-sm font-medium">
                    {t.creditsRemaining}:
                  </span>
                  <span
                    className={`text-lg font-black ${credits !== null && credits > 0
                        ? "text-cyan-400"
                        : "text-rose-400"
                      }`}
                  >
                    {credits !== null ? credits : "..."}
                  </span>
                </GlassCard>
              </motion.div>

              {/* ── No Credits Warning ── */}
              {credits !== null && credits <= 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlassCard className="max-w-lg mx-auto p-6 text-center border border-rose-500/30">
                    <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-rose-300 mb-1">
                      {t.noCredits}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">{t.buyCredits}</p>
                    <button
                      onClick={() => router.push(`/${locale}/pricing`)}
                      className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white transition-all"
                    >
                      {t.goToPricing}
                    </button>
                  </GlassCard>
                </motion.div>
              )}

              {/* ── Search Box ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <GlassCard className="p-6 md:p-8">
                  {/* Search Input */}
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t.searchPlaceholder}
                      className="w-full pl-12 pr-4 py-4 bg-slate-900/60 border border-slate-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 rounded-xl text-white placeholder-slate-500 text-lg transition-all outline-none"
                    />
                  </div>

                  {/* Platform Selection */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        {t.selectPlatforms}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllPlatforms}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {t.selectAll}
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          onClick={deselectAllPlatforms}
                          className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                        >
                          {t.deselectAll}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {platforms.map((platform) => {
                        const isSelected = selectedPlatforms.has(platform.id);
                        const iconKey = platform.icon?.toLowerCase() || platform.id;
                        return (
                          <button
                            key={platform.id}
                            onClick={() => togglePlatform(platform.id)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all duration-200 ${isSelected
                                ? `bg-slate-800/80 ${PLATFORM_BORDER_MAP[iconKey] || "border-cyan-500/40"} text-white`
                                : "bg-slate-900/40 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600"
                              }`}
                          >
                            <span
                              className={
                                isSelected ? "text-white" : "text-slate-500"
                              }
                            >
                              {PLATFORM_ICON_MAP[iconKey] || (
                                <Globe className="w-5 h-5" />
                              )}
                            </span>
                            <span className="text-sm font-medium truncate">
                              {platform.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-cyan-400 ml-auto flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                      >
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {error}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Staged Loading Animation */}
                  {isSearching && (
                    <div className="mb-6 bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-6">
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${loadingProgress}%` }}
                        />
                      </div>

                      {/* Orbital Spinner */}
                      <div className="flex justify-center mb-4">
                        <div className="relative w-16 h-16">
                          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-spin" style={{ animationDuration: '3s' }} />
                          <div className="absolute inset-1 rounded-full border-2 border-purple-500/30 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                          <div className="absolute inset-2 rounded-full border-2 border-cyan-400/40 animate-spin" style={{ animationDuration: '1.5s' }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Search className="w-5 h-5 text-cyan-400 animate-pulse" />
                          </div>
                        </div>
                      </div>

                      {/* Step Text */}
                      <div className="text-center">
                        <p className="text-cyan-400 font-bold text-sm mb-1">
                          {loadingSteps[loadingStep]}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {loadingProgress}% — {t.loadingTeaser}
                        </p>
                      </div>

                      {/* Steps progress */}
                      <div className="flex justify-center gap-2 mt-4">
                        {loadingSteps.map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= loadingStep
                                ? 'bg-cyan-400 scale-110'
                                : 'bg-slate-600'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
                  >
                    {isSearching ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t.searching}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        {t.search}
                      </span>
                    )}
                  </button>
                </GlassCard>
              </motion.div>

              {/* ── Results ── */}
              <AnimatePresence>
                {hasSearched && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <GlassCard className="p-6 md:p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          {t.results}
                        </h2>
                        {creditsRemaining !== null && (
                          <span className="text-sm text-slate-400">
                            {t.remainingAfter}:{" "}
                            <span className="text-cyan-400 font-bold">
                              {creditsRemaining}
                            </span>
                          </span>
                        )}
                      </div>
                      {redirectToPricing && (
                        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 flex items-center justify-between gap-3">
                          <div className="text-sm text-rose-200">{t.buyCredits}</div>
                          <button
                            onClick={() => router.push(`/${locale}/pricing`)}
                            className="px-4 py-2 rounded-lg font-bold text-xs bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
                          >
                            {t.goToPricing}
                          </button>
                        </div>
                      )}

                      {results.length === 0 ? (
                        <div className="text-center py-10">
                          <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-500">{t.noResults}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(() => {
                            const blurSet = previewMode
                              ? computeBlurIndices(
                                results.length,
                                previewRatio,
                                (query || "") + (user?.email || "")
                              )
                              : new Set<number>();
                            return results.map((result, index) => {
                            const iconKey =
                              result.icon?.toLowerCase() ||
                              result.platform?.toLowerCase();
                              const isBlurred = blurSet.has(index);
                              return (
                                <motion.div
                                  key={`${result.platform}-${index}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    delay: index * 0.05,
                                  }}
                                  className={`relative group flex items-center gap-4 p-4 rounded-xl border bg-slate-800/50 transition-all duration-200 ${PLATFORM_BORDER_MAP[iconKey] ||
                                    "border-slate-700 hover:border-slate-600"
                                    }`}
                                >
                                  <a
                                    href={isBlurred ? undefined : result.query_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="contents"
                                  >
                                    <div
                                      className={`p-2.5 rounded-lg bg-gradient-to-br ${PLATFORM_COLOR_MAP[iconKey] ||
                                        "from-slate-600 to-slate-700"
                                        } text-white flex-shrink-0`}
                                    >
                                      {PLATFORM_ICON_MAP[iconKey] || (
                                        <Globe className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div className={`flex-1 min-w-0 ${isBlurred ? "blur-sm select-none" : ""}`}>
                                      <p className="text-white font-semibold text-sm">
                                        {result.platform_name}
                                      </p>
                                      <p className="text-slate-500 text-xs truncate">
                                        {result.query_url}
                                      </p>
                                    </div>
                                    <ExternalLink className={`w-4 h-4 ${isBlurred ? "text-slate-700" : "text-slate-500 group-hover:text-cyan-400"} transition-colors flex-shrink-0`} />
                                  </a>
                                  {isBlurred && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                                      <button
                                        onClick={() => router.push(`/${locale}/pricing`)}
                                        className="px-4 py-2 rounded-lg font-bold text-xs bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
                                      >
                                        {t.goToPricing}
                                      </button>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
