'use client';

const REFRESH_INTERVAL_MS = 30_000;

import { useEffect, useState, useCallback } from 'react';
import { Activity, Users, Search, MapPin, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface HealthStatus {
  status: 'ok' | 'error' | 'loading';
}

interface Stats {
  userCount: number | null;
  healthStatus: HealthStatus;
  lastChecked: string | null;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    userCount: null,
    healthStatus: { status: 'loading' },
    lastChecked: null,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const now = new Date().toLocaleTimeString('tr-TR');

    // Health check
    let healthStatus: HealthStatus = { status: 'error' };
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        healthStatus = { status: data.status === 'ok' ? 'ok' : 'error' };
      }
    } catch {
      healthStatus = { status: 'error' };
    }

    // User count
    let userCount: number | null = null;
    try {
      const res = await fetch('/api/auth/users/count', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        userCount = data.count ?? null;
      }
    } catch {
      userCount = null;
    }

    setStats({ healthStatus, userCount, lastChecked: now });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const StatusBadge = ({ status }: { status: HealthStatus['status'] }) => {
    if (status === 'loading') {
      return (
        <span className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Kontrol ediliyor...
        </span>
      );
    }
    if (status === 'ok') {
      return (
        <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
          <CheckCircle className="h-4 w-4" />
          Çevrimiçi
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-red-400 text-sm font-medium">
        <XCircle className="h-4 w-4" />
        Çevrimdışı
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Paneli</h1>
            <p className="text-slate-400 mt-1">EyeOfTR sistem durumu ve istatistikleri</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>

        {stats.lastChecked && (
          <p className="text-xs text-slate-500">Son güncelleme: {stats.lastChecked}</p>
        )}

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Backend Sağlık */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Activity className="h-5 w-5 text-blue-400" />
              <span className="font-medium">Backend Durumu</span>
            </div>
            <StatusBadge status={stats.healthStatus.status} />
            <p className="text-xs text-slate-500">GET /health</p>
          </div>

          {/* Kayıtlı Kullanıcılar */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="h-5 w-5 text-green-400" />
              <span className="font-medium">Kayıtlı Kullanıcılar</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.userCount !== null ? stats.userCount : '—'}
            </p>
            <p className="text-xs text-slate-500">GET /api/auth/users/count</p>
          </div>

          {/* Aktif Özellikler */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Search className="h-5 w-5 text-purple-400" />
              <span className="font-medium">Aktif Özellikler</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="h-3.5 w-3.5" />
                AlanSearch
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <MapPin className="h-3.5 w-3.5" />
                Konum Arama
              </div>
            </div>
          </div>
        </div>

        {/* API Endpoint Listesi */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">API Endpoint'leri</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left pb-3 pr-4">Metod</th>
                  <th className="text-left pb-3 pr-4">Yol</th>
                  <th className="text-left pb-3">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  { method: 'GET', path: '/health', desc: 'Sağlık kontrolü' },
                  { method: 'GET', path: '/api/search?q=...', desc: 'AlanSearch (Google Dork)' },
                  { method: 'GET', path: '/api/location-search?q=...', desc: 'Konum arama (Nominatim)' },
                  { method: 'POST', path: '/api/auth/register', desc: 'Kullanıcı kaydı' },
                  { method: 'POST', path: '/api/auth/login', desc: 'Kullanıcı girişi' },
                  { method: 'GET', path: '/api/auth/users/count', desc: 'Toplam kullanıcı sayısı' },
                ].map((ep) => (
                  <tr key={ep.path}>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                          ep.method === 'GET'
                            ? 'bg-blue-900/40 text-blue-300'
                            : 'bg-green-900/40 text-green-300'
                        }`}
                      >
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-slate-300">{ep.path}</td>
                    <td className="py-2.5 text-slate-400">{ep.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hızlı Linkler */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Hızlı Linkler</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition"
            >
              Ana Sayfa
            </a>
            <a
              href="/auth/register"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition"
            >
              Kayıt Ol
            </a>
            <a
              href="/auth/login"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition"
            >
              Giriş Yap
            </a>
            <a
              href="/pricing"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition"
            >
              Fiyatlandırma
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
