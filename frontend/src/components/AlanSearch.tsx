
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, AlertCircle } from 'lucide-react';

interface SearchResult {
  name: string;
  url: string;
  snippet: string;
}

export default function AlanSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTime, setSearchTime] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Türkçe karakterleri düzgün URL encode et
  const encodeTurkishQuery = (text: string): string => {
    return encodeURIComponent(text.trim());
  };

  // Türkçe karakter validasyonu
  const isValidTurkishQuery = (text: string): boolean => {
    const turkishCharPattern = /^[a-zA-Z0-9\s\-._~:/?#[\]@!$&'()*+,;=ğüşıöçĞÜŞİÖÇ]+$/;
    return turkishCharPattern.test(text.trim());
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Lütfen bir isim veya anahtar kelime girin');
      setResults([]);
      return;
    }

    if (!isValidTurkishQuery(query)) {
      setError('Geçersiz karakter kullanıldı. Türkçe karakterler desteklenmektedir.');
      return;
    }

    // Önceki istek varsa iptal et
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError('');
    setResults([]);

    const startTime = Date.now();
    const encodedQuery = encodeTurkishQuery(query);

    try {
      const response = await fetch(
        `/api/search?q=${encodedQuery}`,
        {
          method: 'GET',
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      const endTime = Date.now();
      setSearchTime(Math.round((endTime - startTime) / 1000));

      if (!response.ok) {
        if (response.status === 429) {
          setError('Çok hızlı arama yapıyorsunuz. Lütfen 3 saniye bekleyin.');
        } else if (response.status === 404) {
          setError('Sonuç bulunamadı. Farklı bir anahtar kelime veya tam ad deneyin.');
        } else {
          throw new Error(`API Hatası: ${response.status}`);
        }
        return;
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        setError('Sonuç bulunamadı. Farklı bir anahtar kelime veya tam ad deneyin.');
        setResults([]);
        return;
      }

      setResults(data.results);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Arama iptal edildi.');
        } else {
          setError(`Arama başarısız: ${err.message}`);
        }
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
        <h1 className="text-3xl font-bold text-white">AlanSearch</h1>
        <p className="text-gray-400">
          Kişi adı veya bilgisini girin, internette ara (Türkçe karakter desteklenir)
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="örn: Ahmet Öztürk, İstanbul mühendis..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
            maxLength={200}
          />
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {loading && (
          <div className="text-sm text-gray-400">
            Aranıyor... (Biraz zaman alabilir)
          </div>
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
          <div className="text-sm text-gray-400">
            {results.length} sonuç bulundu ({searchTime} saniyede)
          </div>
          <div className="space-y-3">
            {results.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                <h3 className="text-blue-400 hover:text-blue-300 font-medium truncate">
                  {result.name}
                </h3>
                <p className="text-xs text-gray-500 truncate">{result.url}</p>
                <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                  {result.snippet}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
