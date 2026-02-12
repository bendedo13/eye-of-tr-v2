"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
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
        subtitle: "Sosyal medya platformlarinda kisi arama",
        credits: "Kredi",
        creditsRemaining: "Kalan Kredi",
        noCredits: "Krediniz kalmadi",
        buyCredits: "Kredi satin almak icin fiyatlandirma sayfasina gidin",
        goToPricing: "Fiyatlandirma",
        searchPlaceholder: "Kisi adini girin...",
        selectPlatforms: "Platformlari Secin",
        selectAll: "Tumunu Sec",
        deselectAll: "Tumunu Kaldir",
        search: "Ara",
        searching: "Araniyor...",
        results: "Sonuclar",
        noResults: "Sonuc bulunamadi",
        openInGoogle: "Google'da Ac",
        loginRequired: "Bu ozelligi kullanmak icin giris yapin",
        login: "Giris Yap",
        errorFetch: "Veri yuklenirken hata olustu",
        errorSearch: "Arama sirasinda hata olustu",
        enterName: "Lutfen bir isim girin",
        selectAtLeastOne: "En az bir platform secin",
        creditsUsed: "Kullanilan kredi",
        remainingAfter: "Kalan kredi",
        platformsLabel: "Platformlar",
        queryLabel: "Aranan Kisi",
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

  const handleSearch = async () => {
    setError(null);

    if (!user || !token) {
      router.push(`/${locale}/login`);
      return;
    }

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
    setResults([]);
    setHasSearched(false);

    try {
      const data = await api.post<{
        status: string;
        query: string;
        credits_remaining: number;
        results: SearchResult[];
      }>(
        "/api/alan-search/search",
        {
          query: trimmedQuery,
          platforms: Array.from(selectedPlatforms),
        },
        { token }
      );

      setResults(data.results || []);
      setCreditsRemaining(data.credits_remaining);
      setCredits(data.credits_remaining);
      setHasSearched(true);
    } catch (err: any) {
      setError(err?.message || t.errorSearch);
    } finally {
      setIsSearching(false);
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
                    className={`text-lg font-black ${
                      credits !== null && credits > 0
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
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all duration-200 ${
                              isSelected
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

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || (credits !== null && credits <= 0)}
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

                      {results.length === 0 ? (
                        <div className="text-center py-10">
                          <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-500">{t.noResults}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {results.map((result, index) => {
                            const iconKey =
                              result.icon?.toLowerCase() ||
                              result.platform?.toLowerCase();
                            return (
                              <motion.a
                                key={`${result.platform}-${index}`}
                                href={result.query_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.3,
                                  delay: index * 0.05,
                                }}
                                className={`group flex items-center gap-4 p-4 rounded-xl border bg-slate-800/50 hover:bg-slate-800/80 transition-all duration-200 ${
                                  PLATFORM_BORDER_MAP[iconKey] ||
                                  "border-slate-700 hover:border-slate-600"
                                }`}
                              >
                                <div
                                  className={`p-2.5 rounded-lg bg-gradient-to-br ${
                                    PLATFORM_COLOR_MAP[iconKey] ||
                                    "from-slate-600 to-slate-700"
                                  } text-white flex-shrink-0`}
                                >
                                  {PLATFORM_ICON_MAP[iconKey] || (
                                    <Globe className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-semibold text-sm">
                                    {result.platform_name}
                                  </p>
                                  <p className="text-slate-500 text-xs truncate">
                                    {result.query_url}
                                  </p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                              </motion.a>
                            );
                          })}
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
