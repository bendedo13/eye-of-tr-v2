"use client";

import Navbar from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { ChevronLeft, Calendar, User, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";

export default function BlogDetailPage() {
    const params = useParams();
    const slug = params.slug;

    // Mock content generation based on slug
    const title = (slug as string).split("-").join(" ").toUpperCase();

    return (
        <div className="min-h-screen bg-background text-slate-200">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-24 md:py-32">
                <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-widest mb-16 transition-colors">
                    <ChevronLeft size={16} /> BACK TO LIST
                </Link>

                <article>
                    <div className="flex items-center gap-4 text-[10px] font-black text-primary uppercase tracking-widest mb-6">
                        <span>INSIGHTS</span>
                        <span className="text-zinc-800">•</span>
                        <span className="text-zinc-500">FEB 3, 2026</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white mb-12 uppercase tracking-tighter leading-none">
                        {title}
                    </h1>

                    <GlassCard className="p-8 md:p-12 mb-16" hasScanline>
                        <div className="prose prose-invert prose-p:text-zinc-400 prose-headings:text-white max-w-none space-y-8">
                            <p className="text-xl text-zinc-300 font-medium leading-relaxed italic border-l-4 border-primary pl-8">
                                In an era where digital presence is unavoidable, understanding the underlying protocols of facial recognition becomes a necessity for privacy and security.
                            </p>

                            <p>
                                At FaceSeek, we believe in the democratization of information. However, this power comes with monumental responsibility. This article explores the technical architecture of our next-gen AI recognition engine and how we maintain ethical standards while processing global data clusters.
                            </p>

                            <h3 className="text-2xl font-black uppercase tracking-tight">The Biometric Signature</h3>
                            <p>
                                Contrary to popular belief, facial recognition isn't about storing "faces." It's about mathematical vectors. Our system maps 128 unique nodal points—the distance between eyes, the curve of the jawline, the width of the nose—to create a digital signature that remains consistent across different lighting and age gaps.
                            </p>

                            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 flex items-start gap-6">
                                <ShieldCheck className="text-primary shrink-0" size={32} />
                                <p className="text-sm font-medium leading-relaxed m-0">
                                    <strong>PRO TIP:</strong> Always use high-contrast images for initial source mapping. The higher the resolution of the original metadata, the more precise our global index matching becomes.
                                </p>
                            </div>

                            <p>
                                As we move towards a more transparent web, the tools we use must be as robust as the systems they query. FaceSeek remains at the forefront of this evolution, ensuring that our protocols are SECURE, ETHICAL, and UNMATCHED.
                            </p>
                        </div>
                    </GlassCard>
                </article>
            </main>
        </div>
    );
}
