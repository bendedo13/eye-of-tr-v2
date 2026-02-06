import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl font-black">FS</div>
              <span className="text-2xl font-black">FaceSeek</span>
            </div>
            <p className="text-gray-400 text-sm">
              Advanced face recognition platform powered by AI.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Search</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><a href="mailto:benalanx@face-seek.com" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal" className="text-gray-400 hover:text-white transition-colors">Legal Hub</Link></li>
              <li><Link href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/kvkk" className="text-gray-400 hover:text-white transition-colors">KVKK</Link></li>
              <li><Link href="/legal/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="/legal/disclaimer" className="text-gray-400 hover:text-white transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            (c) 2026 FaceSeek. All rights reserved.
          </p>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-4 md:mt-0">
            We do not store images
          </div>
        </div>
      </div>
    </footer>
  );
}
