"use client";

import Navbar from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, Target, Globe, Lock, Cpu, Eye } from "lucide-react";

import { use } from "react";

export default function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  return (
    <div className="min-h-screen bg-background text-slate-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter">ETHICAL <span className="text-primary">FACIAL INTELLIGENCE</span></h1>
          <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
            FaceSeek is the world's leading privacy-focused facial search engine, empowering professionals with responsible AI-powered image intelligence while maintaining the highest standards of ethical facial recognition technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          <GlassCard className="p-12 relative overflow-hidden" hasScanline>
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-8 border border-primary/20">
              <Eye size={32} />
            </div>
            <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter">OUR MISSION: RESPONSIBLE FACIAL INTELLIGENCE</h2>
            <p className="text-zinc-500 leading-relaxed font-medium mb-4">
              FaceSeek is a global facial recognition SaaS platform specializing in ethical image intelligence and privacy-first facial search technology. We bridge the gap between vast public data and actionable insights for security professionals, investigative journalists, OSINT researchers, and cybersecurity teams worldwide.
            </p>
            <p className="text-zinc-500 leading-relaxed font-medium">
              Our core philosophy centers on responsible AI: we believe access to public information is a fundamental right when handled with absolute ethical integrity. Every facial search conducted through our platform adheres to strict GDPR and KVKK compliance standards, ensuring lawful and transparent facial recognition operations.
            </p>
          </GlassCard>

          <GlassCard className="p-12 relative overflow-hidden" hasScanline>
            <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary mb-8 border border-secondary/20">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter">PRIVACY-FIRST FACIAL SEARCH</h2>
            <p className="text-zinc-500 leading-relaxed font-medium mb-4">
              Unlike traditional facial recognition databases, FaceSeek does not build or maintain proprietary biometric archives. Our facial search engine serves as a sophisticated real-time lens into the publicly indexed internet, processing image intelligence queries without permanent data storage.
            </p>
            <p className="text-zinc-500 leading-relaxed font-medium">
              We strictly adhere to international privacy standards including GDPR (General Data Protection Regulation) and KVKK (Turkish Personal Data Protection Law). Our platform is designed for legitimate identification, threat prevention, investigative research, and professional OSINT operations only—never for surveillance or unlawful profiling.
            </p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Target className="text-primary" />, title: "Precision", desc: "98.7% biometric matching accuracy." },
            { icon: <Globe className="text-primary" />, title: "Global Reach", desc: "Indexed across all major data clusters." },
            { icon: <Lock className="text-primary" />, title: "E2E Privacy", desc: "No permanent storage of user uploads." },
            { icon: <Cpu className="text-primary" />, title: "Next-Gen AI", desc: "Proprietary recognition algorithms." }
          ].map((item, idx) => (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center hover:border-primary/30 transition-all group">
              <div className="mb-4 transform group-hover:scale-110 transition-transform">{item.icon}</div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">{item.title}</h4>
              <p className="text-[10px] text-zinc-600 font-bold uppercase">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
