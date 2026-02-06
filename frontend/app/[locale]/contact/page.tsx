"use client";

import Link from "next/link";
import { Mail, MessageSquare, LifeBuoy } from "lucide-react";
import { useLocale } from "next-intl";

const CONTACT_EMAIL = "benalanx@face-seek.com";

export default function ContactPage() {
  const locale = useLocale();
  const isTr = locale === "tr";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold">
            {isTr ? "İletişim" : "Contact"}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mt-3">
            {isTr ? "Size Nasıl Yardımcı Olabiliriz?" : "How Can We Help?"}
          </h1>
          <p className="text-zinc-400 mt-4 max-w-2xl">
            {isTr
              ? "Soru, öneri veya iş birlikleri için bize ulaşın. Destek talepleriniz için destek merkezini kullanabilirsiniz."
              : "Reach out for questions, suggestions, or partnerships. For technical help, use the support center."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 text-white font-semibold">
              <Mail size={18} className="text-cyan-400" />
              {isTr ? "E-Posta" : "Email"}
            </div>
            <p className="text-zinc-400 text-sm mt-3">
              {isTr ? "Bize doğrudan e-posta gönderin." : "Send us an email directly."}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex mt-4 text-cyan-300 hover:text-cyan-200 font-medium"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 text-white font-semibold">
              <LifeBuoy size={18} className="text-cyan-400" />
              {isTr ? "Destek Merkezi" : "Support Center"}
            </div>
            <p className="text-zinc-400 text-sm mt-3">
              {isTr
                ? "Kayıtlı kullanıcılar için destek talebi oluşturun."
                : "Create support tickets if you have an account."}
            </p>
            <Link
              href={`/${locale}/support`}
              className="inline-flex mt-4 text-cyan-300 hover:text-cyan-200 font-medium"
            >
              {isTr ? "Destek Talebi Oluştur" : "Open a Support Ticket"}
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 text-white font-semibold">
              <MessageSquare size={18} className="text-cyan-400" />
              {isTr ? "İş Birliği" : "Business"}
            </div>
            <p className="text-zinc-400 text-sm mt-3">
              {isTr
                ? "Kurumsal iş birlikleri ve özel talepler için bizimle iletişime geçin."
                : "Contact us for enterprise partnerships and custom requests."}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex mt-4 text-cyan-300 hover:text-cyan-200 font-medium"
            >
              {isTr ? "Bize Yazın" : "Email Us"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
