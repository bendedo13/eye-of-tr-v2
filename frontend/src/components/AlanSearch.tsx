
'use client';

import { useState } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export default function AlanSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Lütfen arama terimini girin');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResults([]);

    try {
      // Turkish character URL encoding
      const encodedQuery = encodeURIComponent(query);
      
      const response = await fetch(
        `http://localhost:8003/api/alan-search?q=${encodedQuery}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Hatası: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setResults(data.results);
        setSuccess(`${data.results.length} sonuç bulundu`);
      } else {
        setError('Sonuç bulunamadı. Farklı anahtar kelimeler deneyin.');
      }
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : 'Arama sırasında hata oluştu'
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AlanSearch</h1>
          <p className="text-gray-600">
            Google Dork ile gelişmiş kişi arama
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İsim, e-posta veya sosyal medya hesabı girin..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Aranıyor...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Ara
                </>
              )}
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Hata</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-4">
          {results.map((result, idx) => (
            <a
              key={idx}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-blue-600"
            >
              <h3 className="text-lg font-semibold text-blue-600 hover:underline mb-1">
                {result.title}
              </h3>
              <p className="text-sm text-gray-500 mb-2">{result.url}</p>
              <p className="text-gray-700 line-clamp-2">{result.snippet}</p>
            </a>
          ))}
        </div>

        {/* Empty State */}
        {!loading && results.length === 0 && !error && !success && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Arama yaparak başlayın</p>
          </div>
        )}
      </div>
    </div>
  );
}


### AÇIKLAMA:
AlanSearch bileşeni, Google Dork tabanlı gelişmiş arama için tamamlanmıştır. Arama inputu, Türkçe karakter desteğiyle URL encoding, hata/başarı mesajları ve sonuç listeleme eksiksizdir. Backend API endpoint'i `http://localhost:8003/api/alan-search` ile bağlıdır. Sonuç bulunamadığında fallback mesaj gösterilir.

---

## ADIM 5: FİYATLANDIRMA SAYFASI DÜZELTME