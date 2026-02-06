"use client";

import Navbar from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import { use, useEffect, useState } from "react";

export default function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/public/blog-posts?locale=${encodeURIComponent(locale)}`)
            .then((r) => r.json())
            .then((d) => setPosts(d.items || []))
            .catch(() => setPosts([]))
            .finally(() => setLoading(false));
    }, [locale]);

    return (
        <div className="min-h-screen bg-background text-slate-200">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-24 md:py-32">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter">
                            {locale === "tr" ? "BLOG" : "THE"} <span className="text-primary">{locale === "tr" ? "YAZILARI" : "BLOG"}</span>
                        </h1>
                        <p className="text-zinc-500 text-lg font-medium max-w-xl">
                            {locale === "tr"
                                ? "Yapay zeka, biyometrik güvenlik ve dijital istihbaratın geleceği üzerine içerikler."
                                : "Insights into AI, biometric security, and the future of digital intelligence."}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="text-zinc-500">Loading...</div>
                    ) : posts.length ? (
                        posts.map((post) => (
                        <Link key={post.slug} href={`/${locale}/blog/${post.slug}`} className="group">
                            <GlassCard className="h-full p-8 flex flex-col hover:border-primary/30 transition-all duration-500">
                                <div className="flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">
                                    <span className="text-primary">{post.author_name || "FaceSeek"}</span>
                                    <span className="text-zinc-800">•</span>
                                    <span>{post.published_at ? new Date(post.published_at).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US") : ""}</span>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight group-hover:text-primary transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-zinc-500 font-medium mb-12 flex-1">
                                    {post.excerpt || ""}
                                </p>
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                                    {locale === "tr" ? "Devamını Oku" : "Read More"} <ArrowRight size={16} />
                                </div>
                            </GlassCard>
                        </Link>
                        ))
                    ) : (
                        <div className="text-zinc-500">{locale === "tr" ? "Henüz blog yazısı yok." : "No blog posts yet."}</div>
                    )}
                </div>
            </main>
        </div>
    );
}
