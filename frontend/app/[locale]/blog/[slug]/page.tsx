"use client";

import Navbar from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { ChevronLeft, Calendar, User, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BlogDetailPage() {
    const params = useParams();
    const slug = String(params.slug || "");
    const locale = String(params.locale || "en");
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const mediaBase = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || window.location.origin) : "";
    const resolveMediaUrl = (url?: string) => {
        if (!url) return "";
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        return `${mediaBase}${url}`;
    };

    useEffect(() => {
        setLoading(true);
        fetch(`/api/public/blog-posts/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`)
            .then(async (r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then((d) => setPost(d.post))
            .catch(() => setPost(null))
            .finally(() => setLoading(false));
    }, [slug, locale]);

    return (
        <div className="min-h-screen bg-background text-slate-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27] via-[#0b1230] to-[#070b1d] pointer-events-none"></div>
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-24 md:py-28 relative z-10">
                <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest mb-12 transition-colors">
                    <ChevronLeft size={16} /> {locale === "tr" ? "LİSTEYE DÖN" : "BACK TO LIST"}
                </Link>

                {loading ? (
                    <div className="text-zinc-500">{locale === "tr" ? "Yükleniyor..." : "Loading..."}</div>
                ) : !post ? (
                    <div className="text-zinc-500">{locale === "tr" ? "Yazı bulunamadı." : "Post not found."}</div>
                ) : (
                    <article className="space-y-10">
                        <GlassCard className="p-8 md:p-12 border-white/10 relative overflow-hidden" hasScanline>
                            <div className="absolute inset-0 bg-primary/5 opacity-60"></div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-primary uppercase tracking-widest">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                        <ShieldCheck size={12} /> FaceSeek
                                    </span>
                                    <span className="text-zinc-700">•</span>
                                    <span className="inline-flex items-center gap-2 text-zinc-400">
                                        <User size={12} /> {post.author_name || "FaceSeek"}
                                    </span>
                                    <span className="text-zinc-700">•</span>
                                    <span className="inline-flex items-center gap-2 text-zinc-400">
                                        <Calendar size={12} /> {post.published_at ? new Date(post.published_at).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US") : ""}
                                    </span>
                                </div>

                                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-tight">
                                    {post.title}
                                </h1>

                                {post.excerpt ? (
                                    <p className="text-zinc-400 text-base md:text-lg font-medium leading-relaxed max-w-3xl">
                                        {post.excerpt}
                                    </p>
                                ) : null}
                            </div>
                        </GlassCard>

                        {post.cover_image_url ? (
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                <img
                                    src={resolveMediaUrl(post.cover_image_url)}
                                    alt={post.title}
                                    className="w-full max-h-[420px] object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                            </div>
                        ) : null}

                        <GlassCard className="p-8 md:p-12 border-white/10" hasScanline>
                            <div className="prose prose-invert prose-p:text-zinc-400 prose-headings:text-white prose-strong:text-white prose-a:text-primary max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: post.content_html }} />
                            </div>
                        </GlassCard>
                    </article>
                )}
            </main>
        </div>
    );
}
