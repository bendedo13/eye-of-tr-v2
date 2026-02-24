```typescript
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  query: string;
  count: number;
  error?: string;
}

export default function AlanSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const encodeSearchQuery = (text: string): string => {
    // Türkçe karakterleri UTF-8 ile encode et
    return encodeURIComponent(text);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Lütfen bir arama terimi girin');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      // URL encode ile Türkçe karakterleri düzgün gönder
      const encodedQuery = encodeSearchQuery(query);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003'}/api/search?q=${encodedQuery}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Charset': 'utf-8',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Hatası: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Arama başarısız oldu');
        return;
      }

      if (data.count === 0) {
        setError(
          `"${query}" için sonuç bulunamadı. Lütfen farklı bir anahtar kelime deneyin.`
        );
        setResults([]);
        return;
      }

      setResults(data.results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Alan Search</h1>
        <p className="text-gray-600 mb-6">
          Google Dork tabanlı gelişmiş arama
        </p>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Adı, soyadı veya email girin (Türkçe karakterler desteklenir)..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Aranıyor...' : 'Ara'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              {results.length} sonuç bulundu
            </p>
            {results.map((result, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-semibold text-lg"
                >
                  {result.title}
                </a>
                <p className="text-gray-500 text-sm mt-1">{result.url}</p>
                <p className="text-gray-700 mt-2">{result.snippet}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && !error && (
          <div className="text-center text-gray-500">
            <p>Arama sonuçlarını görmek için "Ara" düğmesine tıklayın</p>
          </div>
        )}
      </div>
    </div>
  );
}
```