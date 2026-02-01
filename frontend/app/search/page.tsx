"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import Card from "@/components/Card";
import ClientOnly from "@/components/ClientOnly";
import { toast } from "@/lib/toast";

/**
 * Yüz Arama Sayfası
 */
export default function SearchPage() {
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Auth guard
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login");
    }
  }, [mounted, loading, user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Dosya boyutu kontrolü (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSearch = async () => {
    if (!file || !token) {
      toast.error("Please select a file and sign in");
      return;
    }

    setSearching(true);
    setResults(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // Upload
      const uploadRes = await fetch(`${apiBase}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.detail || "Upload failed");

      // Search
      const searchRes = await fetch(`${apiBase}/api/search?filename=${uploadData.filename}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData.detail || "Search failed");

      setResults(searchData);
      
      if (searchData.matches?.length > 0) {
        toast.success(`Found ${searchData.matches.length} matches!`);
      } else {
        toast.info("No matches found");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setSearching(false);
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
          <h1 className="text-4xl font-black text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Face Search
          </h1>

          {/* Upload Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
            {!preview ? (
              <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-16 text-center hover:border-indigo-500 transition-all cursor-pointer bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-7xl mb-6">📸</div>
                  <div className="text-2xl font-bold text-gray-700 mb-3">Upload Image</div>
                  <div className="text-gray-500">JPG, PNG, WEBP • Max 10MB</div>
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative rounded-2xl overflow-hidden border-4 border-indigo-200 max-w-md mx-auto">
                  <img src={preview} alt="Preview" className="w-full h-auto" />
                </div>

                <div className="flex gap-4">
                  <label
                    htmlFor="file-upload"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all text-center cursor-pointer"
                  >
                    Change Image
                  </label>

                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg"
                  >
                    {searching ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {searching && (
            <div className="flex justify-center py-12">
              <Loader size="lg" text="Searching for matches..." />
            </div>
          )}

          {results && !searching && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Results</h2>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full font-bold">
                  {results.total_matches || 0} Matches
                </div>
              </div>

              {results.matches && results.matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.matches.map((match: any, i: number) => (
                    <Card
                      key={i}
                      title={match.username || match.platform}
                      subtitle={`@${match.username || "unknown"}`}
                      confidence={match.confidence}
                      platform={match.platform}
                      profileUrl={match.profile_url}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-6xl mb-4">🔍</div>
                  <div className="text-2xl font-semibold mb-2">No matches found</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
