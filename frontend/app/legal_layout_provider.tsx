"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const links = [
        { href: "/legal", label: "Legal Hub" },
        { href: "/legal/privacy", label: "Privacy Policy" },
        { href: "/legal/kvkk", label: "KVKK" },
        { href: "/legal/terms", label: "Terms" },
        { href: "/legal/disclaimer", label: "Disclaimer" },
    ];

    return (
        <div className="min-h-screen bg-background text-slate-200">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-24">
                <div className="flex flex-col lg:flex-row gap-16">
                    <aside className="w-full lg:w-64 shrink-0">
                        <div className="sticky top-40 space-y-2">
                            <h3 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-6">COMPLIANCE HUB</h3>
                            {links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`block px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pathname?.endsWith(link.href)
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "text-zinc-500 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </aside>

                    <div className="flex-1 max-w-3xl">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
