/**
 * Google Custom Search API Integration
 * 
 * API Documentation: https://developers.google.com/custom-search/v1/overview
 */

export interface GoogleSearchResult {
  kind: string;
  title: string;
  htmlTitle: string;
  link: string;
  displayLink: string;
  snippet: string;
  htmlSnippet: string;
  cacheId?: string;
  formattedUrl: string;
  htmlFormattedUrl: string;
  pagemap?: {
    cse_thumbnail?: Array<{
      src: string;
      width: string;
      height: string;
    }>;
    metatags?: Array<{
      [key: string]: string;
    }>;
  };
}

export interface GoogleSearchResponse {
  kind: string;
  url: {
    type: string;
    template: string;
  };
  queries: {
    request: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
    nextPage?: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
  };
  context?: {
    title: string;
  };
  searchInformation: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  items?: GoogleSearchResult[];
}

/**
 * Google Custom Search API çağrısı
 */
export async function searchGoogle(
  query: string,
  startIndex: number = 1
): Promise<GoogleSearchResponse> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const cx = process.env.NEXT_PUBLIC_GOOGLE_CX;

  if (!apiKey || !cx) {
    throw new Error("Google API Key or Custom Search Engine ID is not configured");
  }

  if (!query || query.trim().length === 0) {
    throw new Error("Search query is required");
  }

  // API URL
  const baseUrl = "https://www.googleapis.com/customsearch/v1";
  const params = new URLSearchParams({
    key: apiKey,
    cx: cx,
    q: query.trim(),
    start: startIndex.toString(),
    num: "10", // Her sayfada 10 sonuç
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // API hatalarını handle et
      if (response.status === 429) {
        throw new Error("API rate limit exceeded. Please try again later.");
      } else if (response.status === 403) {
        throw new Error("API key is invalid or restricted.");
      } else if (response.status === 400) {
        throw new Error(errorData.error?.message || "Invalid search query.");
      }
      
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data: GoogleSearchResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch search results");
  }
}

/**
 * Kullanıcı adı için social media query'si oluştur
 */
export function buildUsernameQuery(username: string): string {
  const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  
  // Social media platformlarında arama
  const platforms = [
    "site:linkedin.com",
    "site:twitter.com",
    "site:instagram.com",
    "site:github.com",
    "site:facebook.com",
  ];
  
  return `"${cleanUsername}" (${platforms.join(" OR ")})`;
}

/**
 * Tam ad için genel arama query'si
 */
export function buildFullNameQuery(fullName: string): string {
  const cleanName = fullName.trim();
  return `"${cleanName}"`;
}

/**
 * Sonuç özetini temizle (HTML taglerini kaldır)
 */
export function cleanSnippet(htmlSnippet: string): string {
  return htmlSnippet
    .replace(/<\/?[^>]+(>|$)/g, "") // HTML taglerini kaldır
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // Birden fazla boşluğu tek boşluğa indir
    .trim();
}

/**
 * Domain'den platform adı çıkar
 */
export function extractPlatform(displayLink: string): string | null {
  const lowerLink = displayLink.toLowerCase();
  
  if (lowerLink.includes("linkedin.com")) return "LinkedIn";
  if (lowerLink.includes("twitter.com") || lowerLink.includes("x.com")) return "Twitter/X";
  if (lowerLink.includes("instagram.com")) return "Instagram";
  if (lowerLink.includes("github.com")) return "GitHub";
  if (lowerLink.includes("facebook.com")) return "Facebook";
  if (lowerLink.includes("youtube.com")) return "YouTube";
  if (lowerLink.includes("reddit.com")) return "Reddit";
  if (lowerLink.includes("medium.com")) return "Medium";
  
  return null;
}
