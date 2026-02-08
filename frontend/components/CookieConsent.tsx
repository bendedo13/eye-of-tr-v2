"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function CookieConsent() {
  const locale = useLocale();
  const t = useTranslations("cookie");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("faceseek_cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("faceseek_cookie_consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-[#0a0e27]/95 backdrop-blur-xl border-t border-[#00d9ff]/20 shadow-2xl animate-slide-up">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
        <div className="flex-1 space-y-2">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span className="text-[#00d9ff]">🍪</span> {t("title")}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {t("description")} {t("moreInfo")}{" "}
            <Link href={`/${locale}/legal/privacy`} className="text-[#00d9ff] hover:underline">
              {t("privacyLink")}
            </Link>.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShow(false)}
            className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            {t("reject")}
          </button>
          <button 
            onClick={accept}
            className="flex-1 md:flex-none px-6 py-2.5 bg-[#00d9ff] hover:bg-[#0ea5e9] text-[#0a0e27] font-bold rounded-lg shadow-[0_0_15px_rgba(0,217,255,0.3)] transition-all transform hover:scale-105"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
