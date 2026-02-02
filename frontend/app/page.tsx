"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LiveStats from "@/components/LiveStats";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  ShieldCheck,
  Search,
  Zap,
  Globe,
  Target,
  Lock,
  BarChart3,
  ArrowRight,
  Fingerprint,
  Layers,
  Sparkles
} from "lucide-react";

export default function Home() {
  const { user, mounted, loading } = useAuth();
  const router = useRouter();

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">Initializing Protocol...</div>
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-background text-slate-200 selection:bg-primary/30 selection:text-white">
        <Navbar />

        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-24 px-6 bg-[radial-gradient(circle_at_top,_var(--color-primary-glow)_0%,_transparent_70%)]">
          {/* Advanced Background Grid */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_100%)]"></div>

          <div className="relative max-w-7xl mx-auto text-center z-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
              <Sparkles size={12} /> Next-Gen AI Recognition Engine v2.0
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white mb-8 leading-[0.9] tracking-tighter uppercase whitespace-pre-line animate-in fade-in slide-in-from-bottom-8 duration-1000">
              PROFESYONEL<br />
              <span className="text-zinc-700">İSTİHBARAT</span><br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">PLATFORMU</span>
            </h1>

            <p className="text-zinc-500 text-lg md:text-xl font-medium mb-12 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              Yapay zeka destekli yüz tanıma teknolojisi ile açık kaynaklı istihbarat dünyasında saniyeler içinde kesin eşleşmelere ulaşın.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
              {user ? (
                <>
                  <Button
                    onClick={() => router.push("/search")}
                    className="h-16 px-10 text-base"
                    variant="primary"
                  >
                    <Search className="mr-2" size={20} /> ANALİZİ BAŞLAT
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="h-16 px-10 text-base border-white/5 bg-white/5 hover:bg-white/10"
                    variant="outline"
                  >
                    <BarChart3 className="mr-2" size={20} /> KONTROL PANELİ
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => router.push("/register")} className="h-16 px-12 text-base">
                    🚀 ÜCRETSİZ ERİŞİM SAĞLA
                  </Button>
                  <Button onClick={() => router.push("/login")} className="h-16 px-10 text-base bg-white/5 border-white/5 hover:bg-white/10" variant="outline">
                    OTURUM AÇ
                  </Button>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
                <Fingerprint size={16} /> BIOMETRIC SECURE
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck size={16} /> GDPR COMPLIANT
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
                <Layers size={16} /> MULTI-ENGINE
              </div>
            </div>
          </div>
        </section>

        {/* Live Stats Section */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <LiveStats />
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter">NEDEN <span className="text-zinc-700">FACESEEK?</span></h2>
              <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <Zap size={32} />, title: 'ULTRA HIZLI TARAMA', desc: 'Milyonlarca dijital ayak izini ms mertebesinde analiz edin.' },
                { icon: <Lock size={32} />, title: 'TAM GİZLİLİK', desc: 'Tüm taramalarınız 256-bit uçtan uca şifreleme ile korunur.' },
                { icon: <Globe size={32} />, title: 'GLOBAL VERİ AĞI', desc: 'Google, Bing ve Yandex üzerinde eşzamanlı hibrit arama.' },
                { icon: <Target size={32} />, title: 'HASSAS DOĞRULUK', desc: '%98.7 oranında biyometrik eşleşme performansı.' },
                { icon: <ShieldCheck size={32} />, title: 'OSINT STANDARTLARI', desc: 'Uluslararası açık kaynak istihbarat protokollerine tam uyum.' },
                { icon: <BarChart3 size={32} />, title: 'DERİN ANALİTİK', desc: 'Eşleşen sonuçlar için kapsamlı metadata raporları.' },
              ].map((f, i) => (
                <GlassCard key={i} className="p-10 group hover:border-primary/50 transition-all duration-500">
                  <div className="text-primary mb-8 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">{f.icon}</div>
                  <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">{f.title}</h3>
                  <p className="text-zinc-500 leading-relaxed font-medium">{f.desc}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Layered UI */}
        <section className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-tighter">OPERASYON <span className="text-zinc-700">SÜRECİ</span></h2>
                <div className="space-y-12">
                  {[
                    { step: '01', title: 'VERİ GİRİŞİ', desc: 'Yüksek çözünürlüklü hedef fotoğrafı sisteme yüklenir.' },
                    { step: '02', title: 'BİYOMETRİK ANALİZ', desc: 'Yapay zeka, 128 unik yüz noktasını dijital haritaya döker.' },
                    { step: '03', title: 'GLOBAL TARAMA', desc: 'Global veri havuzları üzerinde eşleşme motoru başlatılır.' },
                    { step: '04', title: 'RAPORLAMA', desc: 'Bulunan eşleşmeler kesinlik oranlarıyla birlikte sunulur.' }
                  ].map((s, idx) => (
                    <div key={idx} className="flex gap-8 group">
                      <div className="text-4xl font-black text-zinc-800 transition-colors group-hover:text-primary">{s.step}</div>
                      <div>
                        <h4 className="text-lg font-black text-white uppercase tracking-widest mb-2">{s.title}</h4>
                        <p className="text-zinc-500 font-medium">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full"></div>
                <GlassCard className="p-4 border-white/10 shadow-2xl relative z-10" hasScanline>
                  <div className="bg-zinc-950 rounded-2xl overflow-hidden aspect-square flex items-center justify-center border border-white/5">
                    <div className="relative group cursor-crosshair w-full h-full flex items-center justify-center">
                      <div className="absolute inset-x-0 h-0.5 bg-primary/50 shadow-[0_0_15px_var(--color-primary)] animate-[scanline_3s_linear_infinite]"></div>
                      <div className="text-[10px] font-black text-primary/50 uppercase tracking-[0.5em]">System Scanning...</div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-40 px-6">
          <div className="max-w-5xl mx-auto">
            <GlassCard className="p-20 text-center relative overflow-hidden" hasScanline>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-primary to-transparent"></div>
              <h2 className="text-4xl md:text-7xl font-black text-white mb-8 uppercase tracking-tighter">İSTİHBARATIN <span className="text-zinc-700">GELECEĞİ</span></h2>
              <p className="text-zinc-500 text-xl font-medium mb-12 max-w-2xl mx-auto">
                Sınırlı süreliğine ücretsiz kayıt fırsatını kaçırmayın. İlk operasyonunuz bizden.
              </p>
              {!user && (
                <Button onClick={() => router.push("/register")} className="h-20 px-12 text-xl shadow-2xl shadow-primary/40">
                  ÜCRETSİZ 1 KREDİ AL <ArrowRight className="ml-4" size={24} />
                </Button>
              )}
            </GlassCard>
          </div>
        </section>

        {/* Professional Footer */}
        <footer className="py-20 px-6 border-t border-white/5 bg-black/40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                  <ShieldCheck size={18} />
                </div>
                <span className="font-black text-xl tracking-tighter text-white">FACE<span className="text-zinc-600">SEEK</span></span>
              </div>
              <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.3em]">© 2026 GLOBAL INTELLIGENCE SERVICES. PROTOCOL SECURED.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-10">
              {['Hakkımızda', 'Gizlilik', 'Güvenlik', 'Fiyatlandırma'].map((item, idx) => (
                <Link key={idx} href={`/${item.toLowerCase().replace('ı', 'i')}`} className="text-[10px] font-black text-zinc-500 hover:text-primary uppercase tracking-[0.2em] transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </ClientOnly>
  );
}
