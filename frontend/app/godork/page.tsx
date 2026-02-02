"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";

const DORK_TYPES = [
  { id: "general", name: "Genel", icon: "🔍" },
  { id: "username", name: "Kullanıcı Adı", icon: "👤" },
  { id: "email", name: "E-posta", icon: "📧" },
  { id: "phone", name: "Telefon", icon: "📱" },
  { id: "documents", name: "Dökümanlar", icon: "📄" },
  { id: "social", name: "Sosyal Medya", icon: "💬" },
];

export default function GoDorkPage() {
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dorkType, setDorkType] = useState("general");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState({ used: 0, limit: 5, remaining: 5 });

  useEffect(() => {
    if (mounted && !loading && !user) router.push("/login");
  }, [mounted, loading, user, router]);

  useEffect(() => {
    if (token) fetchUsage();
  }, [token]);

  const fetchUsage = async () => {
    try {
      const res = await fetch(`/api/dork?userId=${token}`);
      const data = await res.json();
      if (data.usage) setUsage(data.usage);
    } catch (err) {}
  };

  const handleSearch = async () => {
    if (!query.trim()) { setError("Lütfen bir arama terimi girin"); return; }
    setError("");
    setIsSearching(true);
    setResults([]);

    try {
      const res = await fetch("/api/dork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: token, query: query.trim(), dorkType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Arama başarısız"); return; }
      setResults(data.results || []);
      if (data.usage) setUsage(data.usage);
    } catch (err) {
      setError("Bir hata oluştu");
    } finally {
      setIsSearching(false);
    }
  };

  if (!mounted || loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!user) return null;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-full mb-4">
              <span className="text-xl">🔍</span>
              <span className="text-white font-bold">GoDork</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Google Dork Arama</h1>
            <p className="text-slate-400">Günlük {usage.remaining}/{usage.limit} ücretsiz arama</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700">
            <div className="flex flex-wrap gap-2 mb-4">
              {DORK_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setDorkType(type.id)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${dorkType === type.id ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
                >
                  <span>{type.icon}</span>
                  <span>{type.name}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Arama terimi girin..."
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-bold rounded-xl"
              >
                {isSearching ? "..." : "Ara"}
              </button>
            </div>

            {error && <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl">{error}</div>}
          </div>

          {results.length > 0 && (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">{results.length} Sorgu Oluşturuldu</h2>
              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.id} className="flex items-center justify-between bg-slate-700/50 rounded-xl p-4">
                    <code className="text-indigo-300 text-sm flex-1 break-all">{result.query}</code>
                    <a href={result.googleUrl} target="_blank" rel="noopener noreferrer" className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">
                      Google'da Ara
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}