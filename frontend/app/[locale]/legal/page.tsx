import LegalLayout from "../../legal_layout_provider";
import Link from "next/link";

import { use } from "react";

export default function LegalHubPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  return (
    <LegalLayout>
      <div className="space-y-10">
        <section className="space-y-4">
          <h1>Legal & Trust Hub</h1>
          <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">
            Privacy-first • No image storage
          </p>
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-primary font-black uppercase tracking-widest text-sm">We don’t store images</h2>
            <p className="text-zinc-500">
              Uploaded images are processed only to run your search and are deleted automatically. We do not build or sell an image database from user uploads.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black">Documents</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href={`/${locale}/legal/privacy`} className="block bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Privacy Policy</div>
              <div className="text-white font-black mt-2">How we process data</div>
            </Link>
            <Link href={`/${locale}/legal/kvkk`} className="block bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">KVKK</div>
              <div className="text-white font-black mt-2">Turkey-specific compliance</div>
            </Link>
            <Link href={`/${locale}/legal/terms`} className="block bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Terms</div>
              <div className="text-white font-black mt-2">Service rules & usage</div>
            </Link>
            <Link href={`/${locale}/legal/disclaimer`} className="block bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Disclaimer</div>
              <div className="text-white font-black mt-2">Accuracy & liability limits</div>
            </Link>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}

