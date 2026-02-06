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
        <div className="min-h-screen bg-background text-slate-200">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-24 md:py-32">
                <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-widest mb-16 transition-colors">
                    <ChevronLeft size={16} /> {locale === "tr" ? "LİSTEYE DÖN" : "BACK TO LIST"}
                </Link>

                {loading ? (
                    <div className="text-zinc-500">{locale === "tr" ? "Yükleniyor..." : "Loading..."}</div>
                ) : !post ? (
                    <div className="text-zinc-500">{locale === "tr" ? "Yazı bulunamadı." : "Post not found."}</div>
                ) : (
                    <article>
                        <div className="flex items-center gap-4 text-[10px] font-black text-primary uppercase tracking-widest mb-6">
                            <span>{post.author_name || "FaceSeek"}</span>
                            <span className="text-zinc-800">•</span>
                            <span className="text-zinc-500">
                                {post.published_at ? new Date(post.published_at).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US") : ""}
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white mb-12 uppercase tracking-tighter leading-none">
                            {post.title}
                        </h1>

                        <GlassCard className="p-8 md:p-12 mb-16" hasScanline>
                            <div className="prose prose-invert prose-p:text-zinc-400 prose-headings:text-white max-w-none space-y-8">
                                <div dangerouslySetInnerHTML={{ __html: post.content_html }} />
                            </div>
                        </GlassCard>
                    </article>
                )}
            </main>
        </div>
    );
}
