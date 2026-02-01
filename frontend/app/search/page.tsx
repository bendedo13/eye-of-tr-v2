"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";

export default function SearchPage() {
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
        setError("Dosya boyutu 10MB'den küçük olmalı");
        return;
      }

      setFile(selectedFile);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleChangeImage = () => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    setFile(null);
    setPreview(null);
    setResults(null);
    setError(null);
  };

  const handleSearch = async () => {
    if (!file || !token) {
      setError("Lütfen bir fotoğraf seçin ve giriş yapın");
      return;
    }

    setSearching(true);
    setResults(null);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiBase = typeof window !== 'undefined' 
        ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        : 'http://localhost:8000';
      
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
      
      if (searchData.redirect_to_pricing) {
        setError("⚠️ Krediniz bitti! Sonuçları görmek için premium'a geçin.");
      } else if (searchData.total_matches > 0) {
        setError(null);
      } else {
        setError("ℹ️ Sonuç bulunamadı. Lütfen başka bir fotoğraf deneyin.");
      }
    } catch (err: any) {
      setError(err.message || "Arama başarısız");
    } finally {
      setSearching(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-radial">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-4 md:mb-8 text-white neon-text">
            Yüz Arama
          </h1>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-orange-500/10 border border-orange-500/50 text-orange-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Upload Section */}
          <div className="glass-dark rounded-2xl p-4 md:p-8 mb-6 md:mb-8 border border-white/10">
            {!preview ? (
              <div className="border-2 border-dashed border-indigo-400/30 rounded-2xl p-8 md:p-16 text-center hover:border-indigo-500 transition-all cursor-pointer bg-gradient-to-br from-indigo-50/5 to-purple-50/5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-5xl md:text-7xl mb-4 md:mb-6">📸</div>
                  <div className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">
                    Fotoğraf Yükle
                  </div>
                  <div className="text-sm md:text-base text-slate-400">
                    JPG, PNG, WEBP • Max 10MB
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                <div className="relative rounded-2xl overflow-hidden border-4 border-indigo-300 max-w-md mx-auto">
                  <img src={preview} alt="Preview" className="w-full h-auto" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <button
                    onClick={handleChangeImage}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all"
                  >
                    <span className="text-lg md:text-xl">🔄</span>
                    <span>Değiştir</span>
                  </button>

                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="flex-1 btn-primary py-3 md:py-4 px-4 md:px-6 text-base md:text-lg font-bold flex items-center justify-center gap-2"
                  >
                    {searching ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Aranıyor...</span>
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        <span>Ara</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Loading */}
          {searching && (
            <div className="flex flex-col items-center justify-center py-12 md:py-16">
              <div className="spinner mb-4"></div>
              <p className="text-slate-400 text-sm md:text-base">Eşleşmeler aranıyor...</p>
            </div>
          )}

          {/* Results */}
          {results && !searching && (
            <div className="glass-dark rounded-2xl p-4 md:p-8 border border-white/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Sonuçlar</h2>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 md:px-6 py-2 rounded-full font-bold text-sm md:text-base">
                  {results.total_matches || 0} Eşleşme
                </div>
              </div>

              {results.matches && results.matches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {results.matches.map((match: any, i: number) => (
                    <div
                      key={i}
                      className={`card-dark ${match.blurred ? 'blur-premium relative' : ''}`}
                    >
                      {match.blurred && (
                        <div className="premium-overlay">
                          <div className="text-center p-4">
                            <span className="text-4xl mb-2 block">🔒</span>
                            <p className="text-white font-bold text-sm">Premium İçerik</p>
                            <button
                              onClick={() => router.push('/pricing')}
                              className="mt-3 btn-primary px-4 py-2 text-sm"
                            >
                              Satın Al
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="text-4xl mb-3 text-center">{match.platform === 'google' ? '🌐' : match.platform === 'bing' ? '🔎' : '👤'}</div>
                      <h3 className="font-bold text-white text-lg mb-1">{match.username || 'Bilinmiyor'}</h3>
                      <p className="text-slate-400 text-sm mb-2">@{match.username || 'unknown'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{match.platform}</span>
                        <span className="text-sm font-semibold text-indigo-400">{Math.round(match.confidence || 0)}%</span>
                      </div>
                      {!match.blurred && match.profile_url && (
                        <a
                          href={match.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block w-full text-center bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold transition"
                        >
                          🔗 Profili Gör
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-5xl md:text-6xl mb-4">🔍</div>
                  <div className="text-xl md:text-2xl font-semibold mb-2 text-white">
                    Eşleşme bulunamadı
                  </div>
                  <p className="text-sm md:text-base">Lütfen başka bir fotoğraf deneyin</p>
                </div>
              )}

              {results.redirect_to_pricing && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => router.push('/pricing')}
                    className="btn-primary px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-bold inline-flex items-center gap-2"
                  >
                    <span>💎</span>
                    <span>Premium'a Geç</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
