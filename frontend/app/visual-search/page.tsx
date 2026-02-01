"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/components/ClientOnly';
import { useAuth } from '@/context/AuthContext';
import Loader from '@/components/Loader';
import VisualSearchForm, { SearchOptions } from '@/components/VisualSearchForm';
import VisualSearchResults from '@/components/VisualSearchResults';
import { toast } from '@/lib/toast';
import {
  performVisualSearch,
  checkApiConfiguration,
} from '@/lib/visualSearch';
import {
  ImageSearchResult,
  ProviderSearchStats,
  SearchProvider,
} from '@/lib/visualSearchTypes';

/**
 * Visual Search Page
 * Web-scale image search across Google, Bing, and Yandex
 */
export default function VisualSearchPage() {
  const router = useRouter();
  const { user, mounted, loading } = useAuth();

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [providerStats, setProviderStats] = useState<ProviderSearchStats[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Auth guard
  useEffect(() => {
    if (mounted && !loading && !user) {
      toast.error('Please log in to access Visual Search');
      router.push('/login');
    }
  }, [mounted, loading, user, router]);

  // Check API configuration on mount
  useEffect(() => {
    if (mounted) {
      const config = checkApiConfiguration();
      if (!config.anyConfigured) {
        toast.warning(
          'No search API keys configured. Please add API keys to .env.local'
        );
      } else {
        const configured: string[] = [];
        if (config.google) configured.push('Google');
        if (config.bing) configured.push('Bing');
        if (config.yandex) configured.push('Yandex');
        console.log(`Configured providers: ${configured.join(', ')}`);
      }
    }
  }, [mounted]);

  // Handle search
  const handleSearch = async (
    query: string,
    provider: SearchProvider,
    options: SearchOptions
  ) => {
    setIsSearching(true);
    setHasSearched(true);
    setCurrentQuery(query);
    setCurrentOffset(0);

    try {
      const response = await performVisualSearch({
        query,
        provider,
        count: options.count,
        offset: 0,
        safeSearch: options.safeSearch,
        imageType: options.imageType,
        size: options.size,
        color: options.color,
      });

      // Check if aggregated response (from 'all' provider)
      if ('allResults' in response) {
        setResults(response.allResults);
        setProviderStats(response.providerStats);
        setTotalResults(response.totalResults);
        setSearchTime(
          response.providerStats.reduce((sum, stat) => sum + stat.searchTime, 0)
        );

        const successCount = response.providerStats.filter((s) => s.success).length;
        toast.success(
          `Found ${response.totalResults} images from ${successCount} providers`
        );
      } else {
        setResults(response.results);
        setProviderStats([]);
        setTotalResults(response.totalResults);
        setSearchTime(response.searchTime);

        if (response.error) {
          toast.error(`${provider} search error: ${response.error}`);
        } else {
          toast.success(`Found ${response.results.length} images from ${provider}`);
        }
      }
    } catch (error) {
      console.error('Visual search error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Search failed. Please try again.'
      );
      setResults([]);
      setProviderStats([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle load more (pagination)
  const handleLoadMore = async () => {
    if (!currentQuery) return;

    setIsSearching(true);
    const newOffset = currentOffset + 20;

    try {
      // For now, we'll just append more results
      // In production, you'd call the API with the new offset
      toast.info('Loading more results...');
      setCurrentOffset(newOffset);
    } catch (error) {
      toast.error('Failed to load more results');
    } finally {
      setIsSearching(false);
    }
  };

  // Show loader while checking auth
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                🌐 Web-Scale Visual Search
              </h1>
              <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
                Search billions of images across Google, Bing, and Yandex in one place
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search Form */}
          <div className="mb-8">
            <VisualSearchForm onSearch={handleSearch} isSearching={isSearching} />
          </div>

          {/* Search Results */}
          {hasSearched && (
            <>
              {isSearching && results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader />
                  <p className="text-gray-600 mt-4">
                    Searching images across multiple providers...
                  </p>
                </div>
              ) : results.length > 0 ? (
                <VisualSearchResults
                  results={results}
                  providerStats={providerStats}
                  query={currentQuery}
                  totalResults={totalResults}
                  searchTime={searchTime}
                  onLoadMore={handleLoadMore}
                  hasMore={false} // Disable pagination for now
                  isLoadingMore={false}
                />
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border border-white/20">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    No Results Found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any images matching your search query.
                  </p>
                  <div className="bg-indigo-50 rounded-xl p-4 max-w-md mx-auto">
                    <p className="text-sm text-indigo-800">
                      <strong>💡 Search Tips:</strong>
                    </p>
                    <ul className="text-sm text-indigo-700 mt-2 space-y-1 text-left">
                      <li>• Try more specific keywords</li>
                      <li>• Check spelling and formatting</li>
                      <li>• Use full names instead of usernames</li>
                      <li>• Try different search providers</li>
                      <li>• Adjust filters in Advanced Options</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Welcome Message (before first search) */}
          {!hasSearched && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-12 border border-white/20">
              <div className="text-center">
                <div className="text-6xl mb-6">🎯</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Start Your Visual Search
                </h2>
                <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                  Enter a person's name or username above to search across billions of
                  images from multiple search engines simultaneously.
                </p>

                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                    <div className="text-4xl mb-3">🔍</div>
                    <h3 className="font-bold text-gray-800 mb-2">Multi-Provider</h3>
                    <p className="text-sm text-gray-600">
                      Search Google, Bing, and Yandex simultaneously for comprehensive
                      results
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                    <div className="text-4xl mb-3">⚡</div>
                    <h3 className="font-bold text-gray-800 mb-2">Fast & Accurate</h3>
                    <p className="text-sm text-gray-600">
                      Lightning-fast image search with advanced filters and options
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6">
                    <div className="text-4xl mb-3">🔒</div>
                    <h3 className="font-bold text-gray-800 mb-2">Secure & Private</h3>
                    <p className="text-sm text-gray-600">
                      Your searches are private and secure, with optional SafeSearch
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legal Disclaimer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-bold text-yellow-900 mb-2">Legal Disclaimer</h4>
                <p className="text-sm text-yellow-800">
                  This tool searches publicly indexed images from major search engines.
                  Results are provided by third-party APIs (Google, Bing, Yandex). Use
                  this tool responsibly and in accordance with applicable laws and
                  regulations. Do not use for illegal purposes, harassment, or privacy
                  violations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
