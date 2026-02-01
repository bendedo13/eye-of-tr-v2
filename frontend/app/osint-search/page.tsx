"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import ClientOnly from "@/components/ClientOnly";
import OsintSearchForm from "@/components/OsintSearchForm";
import OsintSearchResults from "@/components/OsintSearchResults";
import { toast } from "@/lib/toast";
import {
  searchGoogle,
  buildFullNameQuery,
  buildUsernameQuery,
  type GoogleSearchResult,
} from "@/lib/googleSearch";

/**
 * OSINT Google Search Page
 * Real-time Google Custom Search API integration
 */
export default function OsintSearchPage() {
  const { user, mounted, loading } = useAuth();
  const router = useRouter();
  
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GoogleSearchResult[]>([]);
  const [searchInfo, setSearchInfo] = useState<{
    query: string;
    totalResults: string;
    searchTime: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Auth guard
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login");
    }
  }, [mounted, loading, user, router]);

  // Check if API is configured
  useEffect(() => {
    if (typeof window !== "undefined") {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      const cx = process.env.NEXT_PUBLIC_GOOGLE_CX;
      
      if (!apiKey || !cx) {
        toast.warning("Google API not configured. Please add NEXT_PUBLIC_GOOGLE_CX to .env.local");
      }
    }
  }, []);

  const handleSearch = async (query: string, searchType: "fullname" | "username") => {
    setIsSearching(true);
    setResults([]);
    setSearchInfo(null);
    setCurrentPage(1);
    setHasMore(false);

    try {
      // Build query based on type
      const searchQuery = searchType === "fullname" 
        ? buildFullNameQuery(query)
        : buildUsernameQuery(query);

      // Call Google API
      const response = await searchGoogle(searchQuery, 1);

      if (!response.items || response.items.length === 0) {
        setResults([]);
        setSearchInfo({
          query,
          totalResults: "0",
          searchTime: response.searchInformation.formattedSearchTime,
        });
        toast.info("No results found");
        return;
      }

      setResults(response.items);
      setSearchInfo({
        query,
        totalResults: response.searchInformation.totalResults,
        searchTime: response.searchInformation.formattedSearchTime,
      });

      // Check if there are more pages
      setHasMore(!!response.queries.nextPage);

      toast.success(`Found ${response.items.length} results`);
    } catch (error) {
      console.error("Search error:", error);
      
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to fetch search results");
      }
      
      setResults([]);
      setSearchInfo(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    if (!searchInfo || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * 10 + 1;

    try {
      const searchQuery = searchInfo.query;
      const response = await searchGoogle(searchQuery, startIndex);

      if (response.items && response.items.length > 0) {
        setResults((prev) => [...prev, ...response.items!]);
        setCurrentPage(nextPage);
        setHasMore(!!response.queries.nextPage);
        toast.success(`Loaded ${response.items.length} more results`);
      } else {
        setHasMore(false);
        toast.info("No more results");
      }
    } catch (error) {
      console.error("Load more error:", error);
      toast.error("Failed to load more results");
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              OSINT Google Search
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Search for people using Google Custom Search API with real-time results
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
            <OsintSearchForm onSearch={handleSearch} isLoading={isSearching} />
          </div>

          {/* Loading State */}
          {isSearching && (
            <div className="flex justify-center py-12">
              <Loader size="lg" text="Searching Google..." />
            </div>
          )}

          {/* Results */}
          {!isSearching && searchInfo && (
            <OsintSearchResults
              results={results}
              query={searchInfo.query}
              totalResults={searchInfo.totalResults}
              searchTime={searchInfo.searchTime}
              onLoadMore={hasMore ? handleLoadMore : undefined}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
            />
          )}

          {/* Empty State (no search yet) */}
          {!isSearching && !searchInfo && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Ready to Search?
              </h3>
              <p className="text-gray-600">
                Enter a full name or username to search across the web
              </p>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
