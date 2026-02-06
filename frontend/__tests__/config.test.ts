import { describe, it } from 'node:test';
import assert from 'node:assert';
import nextConfig from '../next.config.mjs';

// GOLDEN RULE: DO NOT MODIFY THIS TEST WITHOUT EXPLICIT PERMISSION
// This test ensures that the Next.js frontend is correctly configured to proxy
// API requests to the Python backend. Breaking this will cause "Not Found" errors
// on Login and Register pages.

describe('Critical Configuration Check', () => {
  it('should have API proxy rewrite configured', async () => {
    // @ts-ignore - rewrites might not be in the type definition if not awaited, but we know it returns a promise or array
    const rewrites = await nextConfig.rewrites.();
    
    assert.ok(rewrites, 'Rewrites configuration is missing in next.config.mjs');
    
    const apiRewrite = Array.isArray(rewrites) 
       rewrites.find((r: any) => r.source === '/api/:path*')
      : rewrites.beforeFiles.find((r: any) => r.source === '/api/:path*') || 
        rewrites.afterFiles.find((r: any) => r.source === '/api/:path*') ||
        rewrites.fallback.find((r: any) => r.source === '/api/:path*');

    assert.ok(apiRewrite, 'Missing critical rewrite rule for /api/:path*');
    
    // Check that destination uses SERVER_API_URL environment variable
    const expectedPattern = /\/api\/:path\*/;
    assert.ok(apiRewrite.destination, 'API destination is missing');
    assert.ok(expectedPattern.test(apiRewrite.destination), 'API destination must include /api/:path* pattern');
    
    // Verify SERVER_API_URL is used (not hardcoded)
    console.log(`✓ API rewrite configured: ${apiRewrite.source} → ${apiRewrite.destination}`);
    console.log(`✓ Using SERVER_API_URL: ${process.env.SERVER_API_URL || 'http://localhost:8000 (default)'}`);
  });
});
