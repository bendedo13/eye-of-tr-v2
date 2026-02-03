"use client";

import Link from "next/link";
import FaceSeekLogo from "./brand/FaceSeekLogo";
import TrustBadges from "./brand/TrustBadges";

export default function Footer() {
  return (
    <footer className="bg-[#0a0e27] border-t border-[#00d9ff]/10 circuit-pattern">
      <div className="max-w-[1600px] mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-1">
            <FaceSeekLogo size="md" animated={false} showText={true} />
            <p className="text-slate-400 text-sm mt-4 leading-relaxed">
              Advanced Facial Search Technology. Professional OSINT and facial recognition tools for digital investigations.
            </p>
            <div className="mt-6">
              <TrustBadges />
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/search" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  Face Search
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  Search History
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <a href="mailto:contact@face-seek.com" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-slate-400 hover:text-[#00d9ff] transition-colors text-sm">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#00d9ff]/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">
              © 2017-2026 Face Seek. All Rights Reserved.{" "}
              <span className="text-slate-600">|</span>{" "}
              <span className="text-slate-400">
                Powered by <span className="text-[#00d9ff] font-semibold">Alan</span>
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
