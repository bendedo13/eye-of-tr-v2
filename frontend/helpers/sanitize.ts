/**
 * Input sanitization ve validation
 */

/**
 * String'i Google query için temizle
 * - Tehlikeli karakterleri kaldır
 * - Whitespace'leri normalize et
 */
export function sanitizeForQuery(input: string): string {
  if (!input) return "";
  
  // Trim ve normalize whitespace
  let cleaned = input.trim().replace(/\s+/g, " ");
  
  // Tehlikeli karakterleri escape et (basit yaklaşım)
  // Google query'de genelde güvenli ama yine de temizlik
  cleaned = cleaned.replace(/[<>]/g, "");
  
  return cleaned;
}

/**
 * Kullanıcı adını temizle
 * - Sadece alfanumerik, dash, underscore
 */
export function sanitizeUsername(username: string): string {
  if (!username) return "";
  return username.trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Input validasyonu
 */
export function validateOsintInput(input: {
  fullName?: string;
  username?: string;
  nickname?: string;
  keyword?: string;
}): { valid: boolean; error?: string } {
  const hasAnyInput = 
    input.fullName?.trim() ||
    input.username?.trim() ||
    input.nickname?.trim() ||
    input.keyword?.trim();

  if (!hasAnyInput) {
    return { valid: false, error: "Please enter at least one search term" };
  }

  // Minimum uzunluk kontrolü
  const values = [input.fullName, input.username, input.nickname, input.keyword]
    .filter(Boolean);
  
  for (const val of values) {
    if (val && val.trim().length < 2) {
      return { valid: false, error: "Search terms must be at least 2 characters" };
    }
    if (val && val.trim().length > 100) {
      return { valid: false, error: "Search terms must be less than 100 characters" };
    }
  }

  return { valid: true };
}

/**
 * URL encode
 */
export function encodeQueryParam(param: string): string {
  return encodeURIComponent(param);
}
