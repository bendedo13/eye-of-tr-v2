"use client";

import Navbar from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";

const blogPosts = [
    {
        title: "The Ethics of AI in Facial Intelligence",
        slug: "ethics-of-ai-facial-intelligence",
        date: "Feb 1, 2026",
        category: "AI",
        excerpt: "How we balance rapid technological advancement with strict global privacy standards.",
    },
    {
        title: "OSINT 101: Navigating the Public Web",
        slug: "osint-101-navigating-public-web",
        date: "Jan 28, 2026",
        category: "OSINT",
        excerpt: "A beginner's guide to using FaceSeek for professional investigative research.",
    },
    {
        title: "Protecting Your Digital Identity in 2026",
        slug: "protecting-digital-identity-2026",
        date: "Jan 20, 2026",
        category: "Privacy",
        excerpt: "Understanding how biometric footprinting works and how to stay secure online.",
    },
];

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-background text-slate-200">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-24 md:py-32">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter">THE <span className="text-primary">BLOG</span></h1>
                        <p className="text-zinc-500 text-lg font-medium max-w-xl">
                            Insights into AI, biometric security, and the future of digital intelligence.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        {["AI", "OSINT", "Privacy", "Tech"].map((cat) => (
                            <span key={cat} className="px-5 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary hover:border-primary/20 cursor-pointer transition-all">
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogPosts.map((post) => (
                        <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                            <GlassCard className="h-full p-8 flex flex-col hover:border-primary/30 transition-all duration-500">
                                <div className="flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">
                                    <span className="text-primary">{post.category}</span>
                                    <span>•</span>
                                    <span>{post.date}</span>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight group-hover:text-primary transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-zinc-500 font-medium mb-12 flex-1">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                                    Read More <ArrowRight size={16} />
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
