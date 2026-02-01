"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import ClientOnly from "@/components/ClientOnly";
import OsintSearchForm from "@/components/OsintSearchForm";
import QueryPreview from "@/components/QueryPreview";
import OsintCategoryTabs from "@/components/OsintCategoryTabs";
import type { OsintSearchInput, OsintQuery } from "@/lib/osintTypes";
import { generateOsintQueries, filterQueriesByCategory } from "@/lib/osintQueries";
import { toast } from "@/lib/toast";

/**
 * OSINT / Google Advanced Search sayfası
 * 
 * Bu modül face recognition'dan bağımsızdır.
 * Sadece Google dork query'leri oluşturur.
 */
export default function OsintPage() {
  const { user, mounted, loading } = useAuth();
  const router = useRouter();
  const [queries, setQueries] = useState<OsintQuery[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  // Auth guard
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login");
    }
  }, [mounted, loading, user, router]);

  const handleSearch = (input: OsintSearchInput) => {
    setIsGenerating(true);
    
    // Simulate processing
    setTimeout(() => {
      const generatedQueries = generateOsintQueries(input);
      setQueries(generatedQueries);
      setActiveCategory("all");
      setIsGenerating(false);
      
      toast.success(`Generated ${generatedQueries.length} queries`);
    }, 500);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) return null;

  // Filter queries
  const filteredQueries = filterQueriesByCategory(queries, activeCategory);

  // Category counts
  const categoryCounts: Record<string, number> = {
    all: queries.length,
    "social-media": queries.filter((q) => q.category === "social-media").length,
    documents: queries.filter((q) => q.category === "documents").length,
    images: queries.filter((q) => q.category === "images").length,
    "public-profiles": queries.filter((q) => q.category === "public-profiles").length,
    other: queries.filter((q) => q.category === "other").length,
  };

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              OSINT / Advanced Search
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Generate Google Advanced Search queries to find publicly indexed information
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
 <OsintSearchForm onSearch={(input: any) => handleSearch(input)} isLoading={isGenerating} />
          </div>

          {/* Results */}
          {queries.length > 0 && (
            <>
              {/* Category Tabs */}
              <div className="mb-8">
                <OsintCategoryTabs
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  counts={categoryCounts}
                />
              </div>

              {/* Query Grid */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Generated Queries
                  </h2>
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full font-bold">
                    {filteredQueries.length} queries
                  </div>
                </div>

                {filteredQueries.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredQueries.map((query) => (
                      <QueryPreview key={query.id} query={query} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="text-lg">No queries in this category</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Empty State */}
          {queries.length === 0 && !isGenerating && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Ready to Start Investigating?
              </h3>
              <p className="text-gray-600">
                Fill in the form above to generate advanced search queries
              </p>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
