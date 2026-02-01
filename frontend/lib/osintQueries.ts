import type { OsintQuery, OsintSearchInput } from "./osintTypes";
import { sanitizeForQuery, sanitizeUsername, encodeQueryParam } from "@/helpers/sanitize";

/**
 * Google Advanced Search / OSINT query generator
 * 
 * Bu modül SADECE query URL'leri oluşturur.
 * Google'ı scrape etmez, API kullanımı placeholder'dır.
 */

const GOOGLE_SEARCH_BASE = "https://www.google.com/search?q=";

/**
 * Social media platformları
 */
const SOCIAL_PLATFORMS = [
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "Twitter/X", domain: "twitter.com" },
  { name: "Facebook", domain: "facebook.com" },
  { name: "Instagram", domain: "instagram.com" },
  { name: "GitHub", domain: "github.com" },
  { name: "Reddit", domain: "reddit.com" },
  { name: "Medium", domain: "medium.com" },
  { name: "YouTube", domain: "youtube.com" },
];

/**
 * Document file types
 */
const DOCUMENT_TYPES = ["pdf", "docx", "xlsx", "pptx", "txt"];

/**
 * Ana query oluşturucu
 */
export function generateOsintQueries(input: OsintSearchInput): OsintQuery[] {
  const queries: OsintQuery[] = [];
  let queryId = 1;

  const { fullName, username, nickname, keyword } = input;
  
  // Sanitize inputs
  const cleanName = fullName ? sanitizeForQuery(fullName) : "";
  const cleanUsername = username ? sanitizeUsername(username) : "";
  const cleanNickname = nickname ? sanitizeForQuery(nickname) : "";
  const cleanKeyword = keyword ? sanitizeForQuery(keyword) : "";

  // 1. SOCIAL MEDIA QUERIES
  if (cleanName || cleanUsername) {
    SOCIAL_PLATFORMS.forEach((platform) => {
      const searchTerm = cleanUsername || cleanName;
      const query = `site:${platform.domain} "${searchTerm}"`;
      
      queries.push({
        id: `q-${queryId++}`,
        query,
        url: GOOGLE_SEARCH_BASE + encodeQueryParam(query),
        category: "social-media",
        platform: platform.name,
        description: `Search for "${searchTerm}" on ${platform.name}`,
      });
    });
  }

  // 2. DOCUMENT QUERIES
  if (cleanName) {
    DOCUMENT_TYPES.forEach((fileType) => {
      const query = `filetype:${fileType} "${cleanName}"`;
      
      queries.push({
        id: `q-${queryId++}`,
        query,
        url: GOOGLE_SEARCH_BASE + encodeQueryParam(query),
        category: "documents",
        description: `${fileType.toUpperCase()} documents containing "${cleanName}"`,
      });
    });

    // Resume/CV specific
    queries.push({
      id: `q-${queryId++}`,
      query: `intitle:"${cleanName}" resume OR CV`,
      url: GOOGLE_SEARCH_BASE + encodeQueryParam(`intitle:"${cleanName}" resume OR CV`),
      category: "documents",
      description: `Resume/CV for "${cleanName}"`,
    });
  }

  // 3. IMAGE QUERIES
  if (cleanName || cleanUsername) {
    const searchTerm = cleanName || cleanUsername;
    const query = `"${searchTerm}"`;
    const imageUrl = `https://www.google.com/search?tbm=isch&q=${encodeQueryParam(query)}`;
    
    queries.push({
      id: `q-${queryId++}`,
      query: `Google Images: ${query}`,
      url: imageUrl,
      category: "images",
      description: `Image search for "${searchTerm}"`,
    });
  }

  // 4. PUBLIC PROFILE QUERIES
  if (cleanName) {
    // Professional profiles
    const profileQuery = `"${cleanName}" (about OR profile OR bio)`;
    queries.push({
      id: `q-${queryId++}`,
      query: profileQuery,
      url: GOOGLE_SEARCH_BASE + encodeQueryParam(profileQuery),
      category: "public-profiles",
      description: `Public profiles for "${cleanName}"`,
    });

    // Contact info
    const contactQuery = `"${cleanName}" (email OR phone OR contact)`;
    queries.push({
      id: `q-${queryId++}`,
      query: contactQuery,
      url: GOOGLE_SEARCH_BASE + encodeQueryParam(contactQuery),
      category: "public-profiles",
      description: `Contact information for "${cleanName}"`,
    });
  }

  // 5. OTHER / GENERAL QUERIES
  if (cleanKeyword) {
    queries.push({
      id: `q-${queryId++}`,
      query: `intext:"${cleanKeyword}"`,
      url: GOOGLE_SEARCH_BASE + encodeQueryParam(`intext:"${cleanKeyword}"`),
      category: "other",
      description: `General search for keyword "${cleanKeyword}"`,
    });
  }

  // Combined query
  if (cleanName && cleanUsername) {
    const combinedQuery = `"${cleanName}" OR "${cleanUsername}"`;
    queries.push({
      id: `q-${queryId++}`,
      query: combinedQuery,
      url: GOOGLE_SEARCH_BASE + encodeQueryParam(combinedQuery),
      category: "other",
      description: `Combined search for name and username`,
    });
  }

  // Nickname specific
  if (cleanNickname) {
    const nicknameQuery = `"${cleanNickname}" (nickname OR "also known as" OR aka)`;
    queries.push({
      id: `q-${queryId++}`,
      query: nicknameQuery,
      url: GOOGLE_SEARCH_BASE + encodeQueryParam(nicknameQuery),
      category: "other",
      description: `Search for nickname "${cleanNickname}"`,
    });
  }

  return queries;
}

/**
 * Query'yi kategorilere göre filtrele
 */
export function filterQueriesByCategory(
  queries: OsintQuery[],
  category: string
): OsintQuery[] {
  if (category === "all") return queries;
  return queries.filter((q) => q.category === category);
}

/**
 * Query'yi kopyala (clipboard)
 */
export async function copyQueryToClipboard(query: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(query);
    return true;
  } catch (err) {
    console.error("Failed to copy query:", err);
    return false;
  }
}
