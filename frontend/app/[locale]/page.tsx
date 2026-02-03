"use client";

import { use } from "react";
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

export default function Home({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Unwrap params Promise using React 19 'use' hook
  const { locale } = use(params);
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
              FACIAL SEARCH<br />
              <span className="text-zinc-700">ENGINE FOR</span><br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">PROFESSIONALS</span>
            </h1>

            <p className="text-zinc-500 text-lg md:text-xl font-medium mb-12 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              FaceSeek is the world's most advanced facial search engine and image intelligence platform. Discover where any face appears across the public web using AI-powered face recognition search technology trusted by investigators, journalists, and security professionals worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
              {user ? (
                <>
                  <Button
                    onClick={() => router.push(`/${locale}/search`)}
                    className="h-16 px-10 text-base"
                    variant="primary"
                  >
                    <Search className="mr-2" size={20} /> START ANALYSIS
                  </Button>
                  <Button
                    onClick={() => router.push(`/${locale}/dashboard`)}
                    className="h-16 px-10 text-base border-white/5 bg-white/5 hover:bg-white/10"
                    variant="outline"
                  >
                    <BarChart3 className="mr-2" size={20} /> DASHBOARD
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => router.push(`/${locale}/register`)} className="h-16 px-12 text-base">
                    🚀 START RECOGNITION FREE
                  </Button>
                  <Button onClick={() => router.push(`/${locale}/login`)} className="h-16 px-10 text-base bg-white/5 border-white/5 hover:bg-white/10" variant="outline">
                    LOG IN
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
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter">WHY <span className="text-primary">FACESEEK?</span></h2>
              <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <Zap size={32} />, title: 'LIGHTNING-FAST FACIAL SEARCH', desc: 'Our reverse image face search technology scans millions of indexed images in milliseconds. Advanced AI face lookup algorithms deliver instant results across global data clusters.' },
                { icon: <Lock size={32} />, title: 'PRIVACY-FOCUSED FACIAL SEARCH', desc: 'Industry-leading 256-bit encryption protects every facial recognition search. Your image data is never permanently stored, ensuring complete privacy in facial intelligence operations.' },
                { icon: <Globe size={32} />, title: 'MULTI-ENGINE OSINT FACE SEARCH', desc: 'Simultaneous queries across Google, Bing, Yandex, and specialized OSINT databases. Our facial search engine aggregates results from the world\'s largest public web indexes.' },
                { icon: <Target size={32} />, title: 'PRECISION BIOMETRIC MATCHING', desc: 'State-of-the-art facial recognition algorithms achieve 98.7% accuracy. Our image intelligence platform uses 128-point facial mapping for unmatched precision in face recognition search.' },
                { icon: <ShieldCheck size={32} />, title: 'ETHICAL AI FACIAL RECOGNITION', desc: 'Full GDPR and KVKK compliance for responsible facial intelligence. Our platform adheres to international standards for ethical AI and open-source intelligence protocols.' },
                { icon: <BarChart3 size={32} />, title: 'COMPREHENSIVE FACIAL ANALYTICS', desc: 'Detailed metadata reports for every facial search result. Track confidence scores, source URLs, and image context with our advanced facial recognition SaaS platform.' },
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
                <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-tighter">HOW OUR <span className="text-zinc-700">FACIAL SEARCH</span> WORKS</h2>
                <div className="space-y-12">
                  {[
                    { step: '01', title: 'IMAGE UPLOAD', desc: 'Upload your target image to our secure facial search engine. Our platform accepts all standard formats and automatically optimizes resolution for maximum face recognition accuracy.' },
                    { step: '02', title: 'AI FACIAL MAPPING', desc: 'Advanced biometric algorithms extract 128 unique facial landmarks. Our image intelligence system creates a mathematical signature for precise facial recognition search across billions of indexed images.' },
                    { step: '03', title: 'MULTI-SOURCE INDEXING', desc: 'Your facial search query is simultaneously processed across Google, Bing, Yandex, and specialized OSINT databases. Our reverse image face search technology aggregates results from global web indexes in real-time.' },
                    { step: '04', title: 'RESULTS & ANALYTICS', desc: 'Receive comprehensive facial intelligence reports with confidence scores, source URLs, and contextual metadata. Every face recognition search includes detailed analytics for professional verification.' }
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
              <h2 className="text-4xl md:text-7xl font-black text-white mb-8 uppercase tracking-tighter">START YOUR <span className="text-zinc-700">FACIAL SEARCH</span></h2>
              <p className="text-zinc-500 text-xl font-medium mb-12 max-w-2xl mx-auto">
                Join thousands of investigators, journalists, and security professionals using the world's most advanced facial recognition search platform. Get your first AI face lookup free.
              </p>
              {!user && (
                <Button onClick={() => router.push(`/${locale}/register`)} className="h-20 px-12 text-xl shadow-2xl shadow-primary/40">
                  TRY FACIAL SEARCH FREE <ArrowRight className="ml-4" size={24} />
                </Button>
              )}
            </GlassCard>
          </div>
        </section>

        {/* Professional Footer */}
        <footer className="py-24 px-6 border-t border-white/5 bg-black/40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
            <div className="flex flex-col items-start max-w-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                  <ShieldCheck size={20} />
                </div>
                <span className="font-black text-2xl tracking-tighter text-white uppercase">FACE<span className="text-primary">SEEK</span></span>
              </div>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
                The world's most advanced public-web facial search engine. Designed for investigators, journalists, and security researchers.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">System Status: Online</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-24">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Platform</h4>
                <div className="flex flex-col gap-4">
                  <Link href={`/${locale}/search`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">Face Search</Link>
                  <Link href={`/${locale}/pricing`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">Pricing</Link>
                  <Link href={`/${locale}/api`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">Enterprise API</Link>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Company</h4>
                <div className="flex flex-col gap-4">
                  <Link href={`/${locale}/about`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">About Us</Link>
                  <Link href={`/${locale}/blog`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">Blog</Link>
                  <Link href={`/${locale}/contact`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">Contact</Link>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Legal</h4>
                <div className="flex flex-col gap-4">
                  <Link href={`/${locale}/privacy`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">Privacy Policy</Link>
                  <Link href={`/${locale}/terms`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">Terms of Service</Link>
                  <Link href={`/${locale}/legal/disclaimer`} className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">Disclaimer</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">© 2026 FaceSeek. All protocols reserved.</p>
            <div className="flex items-center gap-6">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">ISO 27001 CLOUD</span>
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">GDPR COMPLIANT</span>
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">ENCRYPTED NODE</span>
            </div>
          </div>
        </footer>
      </div>
    </ClientOnly>
  );
}
