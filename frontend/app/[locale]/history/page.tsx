"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import Card from "@/components/Card";
import Pagination from "@/components/Pagination";
import ClientOnly from "@/components/ClientOnly";
import { formatRelativeTime } from "@/helpers/format";

/**
 * Arama Geçmişi Sayfası
 */
interface SearchHistoryItem {
  id: number;
  imageUrl: string;
  date: string;
  matchCount: number;
  status: "completed" | "pending" | "failed";
}

import { use } from "react";

export default function HistoryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { user, mounted, loading } = useAuth();
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "failed">("all");

  const itemsPerPage = 9;

  // Auth guard
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login");
    }
  }, [mounted, loading, user, router]);

  // Mock data yükleme
  useEffect(() => {
    if (user) {
      // TODO: API'den gerçek veriyi çek
      setTimeout(() => {
        const mockData: SearchHistoryItem[] = Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          imageUrl: `https://via.placeholder.com/300x200?text=Search+${i + 1}`,
          date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          matchCount: Math.floor(Math.random() * 10),
          status: ["completed", "pending", "failed"][Math.floor(Math.random() * 3)] as any,
        }));
        setHistoryItems(mockData);
        setIsLoading(false);
      }, 1000);
    }
  }, [user]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) return null;

  // Filter ve pagination
  const filteredItems = historyItems.filter(
    (item) => filter === "all" || item.status === filter
  );
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusStyles = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-black text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Search History
          </h1>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            {(["all", "completed", "pending", "failed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${filter === status
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* History Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" text="Loading history..." />
            </div>
          ) : paginatedItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100"
                  >
                    <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden mb-4">
                      <img
                        src={item.imageUrl}
                        alt={`Search ${item.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">
                          {formatRelativeTime(item.date)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[item.status]
                            }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">
                          {item.matchCount} matches
                        </span>
                        <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">📭</div>
              <div className="text-2xl font-semibold text-gray-800 mb-2">No searches yet</div>
              <div className="text-gray-600 mb-6">Start searching to see your history here</div>
              <button
                onClick={() => router.push("/search")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg"
              >
                Start Searching
              </button>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
