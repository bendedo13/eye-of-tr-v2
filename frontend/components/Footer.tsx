"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import FaceSeekLogo from "./brand/FaceSeekLogo";
import TrustBadges from "./brand/TrustBadges";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations('footer');

  return (
    <footer className="bg-[#0a0e27] border-t border-[#00d9ff]/10 circuit-pattern">
      <div className="max-w-[1600px] mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-1">
            <FaceSeekLogo size="md" animated={false} showText={true} />
            <p className="text-slate-400 text-sm mt-4 leading-relaxed">
              {t('description')}
            </p>
            <div className="mt-6">
              <TrustBadges />
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{t('product')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/search`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('faceSearch')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/support`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('support')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/pricing`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('pricing')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dashboard`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('dashboard')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/history`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('history')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{t('company')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/legal/about`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('blog')}
                </Link>
              </li>
              <li>
                <a href="mailto:contact@face-seek.com" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('contact')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{t('legal')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/legal`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('legalHub')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/legal/privacy`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/legal/terms`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/legal/kvkk`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('kvkk')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/legal/disclaimer`} className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  {t('disclaimer')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#00d9ff]/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">
              © 2017-2026 Face Seek. {t('allRightsReserved')}.{" "}
              <span className="text-slate-600">|</span>{" "}
              <span className="text-slate-400">
                {t('poweredBy')} <span className="text-[#00d9ff] font-semibold">Alan</span>
              </span>
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/faceseek"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-[#00d9ff] transition-colors text-xs"
              >
                Twitter
              </a>
              <a
                href="https://linkedin.com/company/faceseek"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-[#00d9ff] transition-colors text-xs"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/faceseek"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-[#00d9ff] transition-colors text-xs"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}