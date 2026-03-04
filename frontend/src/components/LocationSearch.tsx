
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

export default function LocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Lütfen bir konum girin');
      setResults([]);
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch(
        `/api/location-search?q=${encodeURIComponent(query.trim())}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          setError('Çok hızlı istek. Lütfen 1 saniye bekleyin.');
        } else if (response.status === 404) {
          setError('Konum bulunamadı. Farklı bir arama terimi deneyin.');
        } else {
          throw new Error(`API Hatası: ${response.status}`);
        }
        return;
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        setError('Konum bulunamadı. Farklı bir arama terimi deneyin.');
        return;
      }

      setResults(data.results);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Arama başarısız: ${err.message}`);
      } else {
        setError('Bilinmeyen bir hata oluştu.');
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Konum Arama</h2>
        <p className="text-gray-400">
          Şehir, ilçe veya adres girin (OpenStreetMap ile ücretsiz)
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="örn: İstanbul, Kadıköy, Ankara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
            maxLength={200}
          />
          <Button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 px-3 py-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
        </div>

        {loading && (
          <div className="text-sm text-gray-400">Aranıyor...</div>
        )}
      </form>

      {error && (
        <div className="flex gap-3 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-200">{error}</div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-400">{results.length} konum bulundu</div>
          <div className="space-y-3">
            {results.map((result, idx) => (
              <a
                key={idx}
                href={`https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}&zoom=14`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-green-400 hover:text-green-300 font-medium text-sm">
                      {result.display_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {result.lat}, {result.lon} · {result.type}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
