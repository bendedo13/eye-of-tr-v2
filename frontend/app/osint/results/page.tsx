"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import ClientOnly from "@/components/ClientOnly";
import OsintResultCard from "@/components/OsintResultCard";
import Pagination from "@/components/Pagination";
import type { OsintResult } from "@/lib/osintTypes";

/**
 * OSINT sonuçları sayfası
 * 
 * NOT: Google Custom Search API entegrasyonu için placeholder.
 * Production'da Google Custom Search API kullanılabilir.
 */
export default function OsintResultsPage() {
  const { user, mounted, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<OsintResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const resultsPerPage = 10;

  // Auth guard
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login");
    }
  }, [mounted, loading, user, router]);

  // Fetch results (mock data)
  useEffect(() => {
    if (query && user) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        // Mock results
        const mockResults: OsintResult[] = Array.from({ length: 25 }, (_, i) => ({
          id: `result-${i + 1}`,
          title: `Result ${i + 1}: ${query}`,
          url: `https://example.com/result-${i + 1}`,
          snippet: `This is a sample result snippet for query "${query}". In production, this would be real data from Google Custom Search API.`,
          category: (category as any) || "other",
          displayUrl: `example.com/result-${i + 1}`,
          platform: i % 3 === 0 ? "LinkedIn" : undefined,
        }));

        setResults(mockResults);
        setIsLoading(false);
      }, 1000);
    }
  }, [query, category, user]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) return null;

  if (!query) {
    router.push("/osint");
    return null;
  }

  // Pagination
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const paginatedResults = results.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-indigo-600 hover:text-indigo-800 font-medium mb-4 flex items-center gap-2"
            >
              ← Back to Search
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Search Results</h1>
            <p className="text-gray-600">
              Query: <span className="font-mono bg-gray-100 px-3 py-1 rounded">{query}</span>
            </p>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" text="Loading results..." />
            </div>
          ) : (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Results</h2>
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full font-bold text-sm">
                    {results.length} results
                  </div>
                </div>

                {paginatedResults.length > 0 ? (
                  <div className="space-y-4">
                    {paginatedResults.map((result) => (
                      <OsintResultCard key={result.id} result={result} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">🔍</div>
                    <div className="text-xl font-semibold mb-2">No results found</div>
                    <p className="text-sm">Try adjusting your search terms</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}

              {/* Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> These are sample results. In production, integrate Google Custom Search API
                  or similar service for real data.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
