"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import {
  Upload,
  Search,
  RotateCcw,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  AlertCircle,
  Clock,
  ExternalLink,
  Target
} from "lucide-react";
import { toast } from "@/lib/toast";

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
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("Dosya boyutu 10MB'den küçük olmalı");
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
    setFile(null);
    setPreview(null);
    setResults(null);
    setError(null);
  };

  const handleSearch = async () => {
    if (!file || !token) {
      toast.error("Lütfen bir fotoğraf seçin.");
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

      const uploadRes = await fetch(`${apiBase}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.detail || "Upload failed");

      const searchRes = await fetch(`${apiBase}/api/search?filename=${uploadData.filename}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData.detail || "Search failed");

      setResults(searchData);

      if (searchData.redirect_to_pricing) {
        setError("Krediniz bitti! Sonuçları görmek için premium'a geçin.");
      }
    } catch (err: any) {
      setError(err.message || "Arama başarısız");
      toast.error("Sistem hatası: Sunucuya bağlanılamadı.");
    } finally {
      setSearching(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">Initializing Scan Engine...</div>
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
              YÜZ <span className="text-zinc-700">TARAMA</span> <span className="text-primary">MOTORU</span>
            </h1>
            <p className="text-zinc-500 text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
              <ShieldCheck size={16} className="text-primary" /> SECURED INTELLIGENCE INTERFACE V2.0
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-xl mx-auto mb-10 bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex items-center gap-4 animate-in zoom-in duration-300">
              <AlertCircle className="text-rose-500 flex-shrink-0" size={24} />
              <p className="text-rose-500 text-[11px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          {/* Upload Section */}
          <GlassCard className="max-w-3xl mx-auto p-12 mb-16" hasScanline>
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
                  className="flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] p-24 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/40 transition-all cursor-pointer group"
                >
                  <div className="w-24 h-24 bg-primary/20 rounded-[32px] flex items-center justify-center text-primary mb-8 shadow-2xl shadow-primary/20 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <Upload size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">HEDEF GÖRSELİ YÜKLE</h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">JPG, PNG, WEBP • MAX 10MB</p>
                </label>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="relative max-w-sm mx-auto group">
                  <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all"></div>
                  <div className="relative rounded-[32px] overflow-hidden border-2 border-primary/40 shadow-2xl">
                    <img src={preview} alt="Target Preview" className="w-full aspect-square object-cover" />
                    {searching && (
                      <div className="absolute inset-x-0 h-1 bg-primary/80 shadow-[0_0_20px_var(--color-primary)] animate-[scanline_2s_linear_infinite]"></div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 max-w-sm mx-auto">
                  <Button
                    onClick={handleChangeImage}
                    variant="outline"
                    className="flex-1 h-14 bg-white/5 border-white/5 hover:bg-white/10"
                    disabled={searching}
                  >
                    <RotateCcw className="mr-2" size={18} /> DEĞİŞTİR
                  </Button>

                  <Button
                    onClick={handleSearch}
                    className="flex-1 h-14"
                    isLoading={searching}
                    disabled={searching}
                  >
                    <Target className="mr-2" size={18} /> TARAMAYI BAŞLAT
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Results Section */}
          {results && !searching && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-white/5 p-8 rounded-[32px] border border-white/5">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">TARAMA <span className="text-zinc-700">SONUÇLARI</span></h2>
                  <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                    <Zap size={12} className="text-primary" /> {results.total_matches || 0} POTANSİYEL EŞLEŞME BULUNDU
                  </p>
                </div>
                <div className="h-10 w-[1px] bg-white/5 hidden md:block"></div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">DATA PROVIDERS</div>
                    <div className="flex gap-2">
                      {results.providers_used?.map((p: string) => (
                        <span key={p} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-black text-primary uppercase">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {results.matches && results.matches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {results.matches.map((match: any, i: number) => (
                    <GlassCard
                      key={i}
                      className={`group hover:border-primary/40 transition-all duration-500 ${match.blurred ? 'relative overflow-hidden' : ''}`}
                    >
                      {/* Match Detail */}
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors">
                            {match.platform === 'google' ? <Globe size={24} /> : <Search size={24} />}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-white tracking-tighter">{Math.round(match.confidence || 0)}%</div>
                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">CONFIDENCE</div>
                          </div>
                        </div>

                        <div className={`space-y-4 ${match.blurred ? 'blur-md grayscale pointer-events-none' : ''}`}>
                          <div className="aspect-square rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden">
                            {match.image_url && <img src={match.image_url} alt="Result" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight truncate">{match.username || 'BİLİNMEYEN ANALİST'}</h3>
                            <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">SOURCE: {match.platform.toUpperCase()}</p>
                          </div>
                        </div>

                        {match.blurred ? (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-2xl shadow-primary/20">
                              <AlertCircle size={32} />
                            </div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2 text-center">İÇERİK KORUMALI</h4>
                            <p className="text-[10px] text-zinc-400 font-bold text-center mb-8">TAM ERİŞİM VE PROFİL LİNKİ İÇİN OPERASYONEL KREDİ GEREKLİDİR.</p>
                            <Button onClick={() => router.push('/pricing')} className="h-12 w-full text-[10px]">
                              KREDİ SATIN AL <ArrowRight className="ml-2" size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-8 pt-8 border-t border-white/5">
                            <button
                              onClick={() => match.profile_url && window.open(match.profile_url, '_blank')}
                              className="w-full h-14 bg-white/5 hover:bg-primary text-zinc-400 hover:text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/5 hover:border-primary/50"
                            >
                              PROFİLİ GÖR <ExternalLink size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <GlassCard className="p-20 text-center max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-zinc-800 rounded-[28px] flex items-center justify-center text-zinc-600 mx-auto mb-8">
                    <Search size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">EŞLEŞME BULUNAMADI</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">Sistem internet genelindeki açık kaynakları taradı ancak görselle eşleşen bir sonuç bulamadı. Lütfen farklı bir açıdan çekilmiş görsel deneyin.</p>
                </GlassCard>
              )}

              {results.redirect_to_pricing && (
                <div className="mt-20 text-center">
                  <div className="glass-dark inline-flex flex-col items-center p-12 rounded-[40px] border border-primary/20 relative">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-2xl shadow-primary/20 border border-primary/40">
                      <Zap size={32} />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tight mt-6">SINIRSIZ TARAMA GEREKLİ</h3>
                    <p className="text-zinc-500 font-medium mb-10 max-w-sm">Daha fazla sonuç görmek ve detaylara ulaşmak için Premium üyeliğe geçiş yapın.</p>
                    <Button onClick={() => router.push('/pricing')} className="h-16 px-12 text-base shadow-2xl shadow-primary/30">
                      PREMIUM'A GEÇ <Zap className="ml-3" size={20} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
