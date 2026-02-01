/**
 * Visual Search API Integration
 * Web-scale image search using Google, Bing, and Yandex APIs
 */

import {
  ImageSearchResult,
  VisualSearchParams,
  VisualSearchResponse,
  AggregatedSearchResponse,
  ProviderSearchStats,
  SearchProvider,
} from './visualSearchTypes';

// API Configuration (from environment variables)
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const GOOGLE_CX = process.env.NEXT_PUBLIC_GOOGLE_CX || '';
const BING_API_KEY = process.env.NEXT_PUBLIC_BING_API_KEY || '';
const YANDEX_API_KEY = process.env.NEXT_PUBLIC_YANDEX_API_KEY || '';

// Backend proxy endpoint (for secure API calls)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Search Google Images using Custom Search API
 */
export async function searchGoogleImages(
  params: VisualSearchParams
): Promise<VisualSearchResponse> {
  const startTime = Date.now();
  
  try {
    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      throw new Error('Google API credentials not configured');
    }

    const searchParams = new URLSearchParams({
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CX,
      q: params.query,
      searchType: 'image',
      num: String(params.count || 10),
      start: String(params.offset || 1),
      safe: params.safeSearch ? 'active' : 'off',
    });

    if (params.imageType) {
      searchParams.append('imgType', params.imageType);
    }
    if (params.size && params.size !== 'all') {
      searchParams.append('imgSize', params.size);
    }
    if (params.color) {
      searchParams.append('imgDominantColor', params.color);
    }

    const url = `https://www.googleapis.com/customsearch/v1?${searchParams}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Google API error: ${response.status}`
      );
    }

    const data = await response.json();
    const searchTime = Date.now() - startTime;

    const results: ImageSearchResult[] = (data.items || []).map(
      (item: any, index: number) => ({
        id: `google-${params.offset || 1}-${index}`,
        title: item.title || 'Untitled',
        url: item.link,
        thumbnailUrl: item.image?.thumbnailLink || item.link,
        thumbnailWidth: parseInt(item.image?.thumbnailWidth) || 150,
        thumbnailHeight: parseInt(item.image?.thumbnailHeight) || 150,
        imageUrl: item.link,
        imageWidth: parseInt(item.image?.width) || 0,
        imageHeight: parseInt(item.image?.height) || 0,
        sourceUrl: item.image?.contextLink || item.link,
        sourceDomain: new URL(item.displayLink || item.link).hostname,
        provider: 'google' as SearchProvider,
        contentType: item.mime,
        hostPageUrl: item.image?.contextLink,
        hostPageDomain: item.displayLink,
        description: item.snippet,
      })
    );

    return {
      results,
      totalResults: parseInt(data.searchInformation?.totalResults) || 0,
      provider: 'google',
      query: params.query,
      nextOffset: (params.offset || 1) + (params.count || 10),
      searchTime,
    };
  } catch (error) {
    const searchTime = Date.now() - startTime;
    console.error('Google image search error:', error);
    return {
      results: [],
      totalResults: 0,
      provider: 'google',
      query: params.query,
      searchTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search Bing Images using Bing Image Search API
 */
export async function searchBingImages(
  params: VisualSearchParams
): Promise<VisualSearchResponse> {
  const startTime = Date.now();

  try {
    if (!BING_API_KEY) {
      throw new Error('Bing API key not configured');
    }

    const searchParams = new URLSearchParams({
      q: params.query,
      count: String(params.count || 10),
      offset: String(params.offset || 0),
      safeSearch: params.safeSearch ? 'Strict' : 'Off',
    });

    if (params.imageType) {
      searchParams.append('imageType', params.imageType);
    }
    if (params.size && params.size !== 'all') {
      searchParams.append('size', params.size);
    }
    if (params.color) {
      searchParams.append('color', params.color);
    }

    const url = `https://api.bing.microsoft.com/v7.0/images/search?${searchParams}`;
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Bing API error: ${response.status}`
      );
    }

    const data = await response.json();
    const searchTime = Date.now() - startTime;

    const results: ImageSearchResult[] = (data.value || []).map(
      (item: any, index: number) => ({
        id: `bing-${params.offset || 0}-${index}`,
        title: item.name || 'Untitled',
        url: item.contentUrl,
        thumbnailUrl: item.thumbnailUrl,
        thumbnailWidth: item.thumbnail?.width || 150,
        thumbnailHeight: item.thumbnail?.height || 150,
        imageUrl: item.contentUrl,
        imageWidth: item.width || 0,
        imageHeight: item.height || 0,
        sourceUrl: item.hostPageUrl,
        sourceDomain: item.hostPageDomainFriendlyName || new URL(item.hostPageUrl).hostname,
        provider: 'bing' as SearchProvider,
        contentType: item.encodingFormat,
        encodingFormat: item.encodingFormat,
        hostPageUrl: item.hostPageUrl,
        hostPageDomain: item.hostPageDomainFriendlyName,
        description: item.name,
        timestamp: item.datePublished,
      })
    );

    return {
      results,
      totalResults: data.totalEstimatedMatches || 0,
      provider: 'bing',
      query: params.query,
      nextOffset: (params.offset || 0) + (params.count || 10),
      searchTime,
    };
  } catch (error) {
    const searchTime = Date.now() - startTime;
    console.error('Bing image search error:', error);
    return {
      results: [],
      totalResults: 0,
      provider: 'bing',
      query: params.query,
      searchTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search Yandex Images using Yandex Image Search API
 */
export async function searchYandexImages(
  params: VisualSearchParams
): Promise<VisualSearchResponse> {
  const startTime = Date.now();

  try {
    if (!YANDEX_API_KEY) {
      throw new Error('Yandex API key not configured');
    }

    // Yandex Images API endpoint (note: may require backend proxy)
    const searchParams = new URLSearchParams({
      apikey: YANDEX_API_KEY,
      text: params.query,
      type: 'image',
      results: String(params.count || 10),
      page: String(Math.floor((params.offset || 0) / (params.count || 10))),
    });

    const url = `https://yandex.com/images/search?${searchParams}`;
    
    // Note: Yandex may require backend proxy or CORS handling
    const response = await fetch(`${API_BASE}/api/visual-search/yandex`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: params.query, ...params }),
    });

    if (!response.ok) {
      throw new Error(`Yandex API error: ${response.status}`);
    }

    const data = await response.json();
    const searchTime = Date.now() - startTime;

    const results: ImageSearchResult[] = (data.results || []).map(
      (item: any, index: number) => ({
        id: `yandex-${params.offset || 0}-${index}`,
        title: item.title || 'Untitled',
        url: item.url,
        thumbnailUrl: item.thumb || item.url,
        thumbnailWidth: item.thumbWidth || 150,
        thumbnailHeight: item.thumbHeight || 150,
        imageUrl: item.url,
        imageWidth: item.width || 0,
        imageHeight: item.height || 0,
        sourceUrl: item.source || item.url,
        sourceDomain: item.domain || new URL(item.url).hostname,
        provider: 'yandex' as SearchProvider,
        description: item.description,
      })
    );

    return {
      results,
      totalResults: data.totalResults || 0,
      provider: 'yandex',
      query: params.query,
      nextOffset: (params.offset || 0) + (params.count || 10),
      searchTime,
    };
  } catch (error) {
    const searchTime = Date.now() - startTime;
    console.error('Yandex image search error:', error);
    return {
      results: [],
      totalResults: 0,
      provider: 'yandex',
      query: params.query,
      searchTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Aggregate search from all providers
 */
export async function searchAllProviders(
  params: VisualSearchParams
): Promise<AggregatedSearchResponse> {
  const startTime = Date.now();

  // Execute all searches in parallel
  const [googleResults, bingResults, yandexResults] = await Promise.all([
    searchGoogleImages({ ...params, provider: 'google' }),
    searchBingImages({ ...params, provider: 'bing' }),
    searchYandexImages({ ...params, provider: 'yandex' }),
  ]);

  const allResults = [
    ...googleResults.results,
    ...bingResults.results,
    ...yandexResults.results,
  ];

  const providerStats: ProviderSearchStats[] = [
    {
      provider: 'google',
      resultCount: googleResults.results.length,
      searchTime: googleResults.searchTime,
      success: !googleResults.error,
      error: googleResults.error,
    },
    {
      provider: 'bing',
      resultCount: bingResults.results.length,
      searchTime: bingResults.searchTime,
      success: !bingResults.error,
      error: bingResults.error,
    },
    {
      provider: 'yandex',
      resultCount: yandexResults.results.length,
      searchTime: yandexResults.searchTime,
      success: !yandexResults.error,
      error: yandexResults.error,
    },
  ];

  const totalSearchTime = Date.now() - startTime;

  return {
    allResults,
    providerStats,
    totalResults: allResults.length,
    query: params.query,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Main search function that routes to appropriate provider(s)
 */
export async function performVisualSearch(
  params: VisualSearchParams
): Promise<VisualSearchResponse | AggregatedSearchResponse> {
  if (params.provider === 'all') {
    return await searchAllProviders(params);
  }

  switch (params.provider) {
    case 'google':
      return await searchGoogleImages(params);
    case 'bing':
      return await searchBingImages(params);
    case 'yandex':
      return await searchYandexImages(params);
    default:
      return await searchGoogleImages(params);
  }
}

/**
 * Helper: Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Helper: Format image size
 */
export function formatImageSize(width: number, height: number): string {
  if (!width || !height) return 'Unknown';
  return `${width} × ${height}`;
}

/**
 * Helper: Check if API keys are configured
 */
export function checkApiConfiguration(): {
  google: boolean;
  bing: boolean;
  yandex: boolean;
  anyConfigured: boolean;
} {
  const google = !!(GOOGLE_API_KEY && GOOGLE_CX);
  const bing = !!BING_API_KEY;
  const yandex = !!YANDEX_API_KEY;

  return {
    google,
    bing,
    yandex,
    anyConfigured: google || bing || yandex,
  };
}
