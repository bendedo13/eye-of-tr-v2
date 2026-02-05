import { describe, it } from 'node:test';
import assert from 'node:assert';
import nextConfig from '../next.config';

// GOLDEN RULE: DO NOT MODIFY THIS TEST WITHOUT EXPLICIT PERMISSION
// This test ensures that the Next.js frontend is correctly configured to proxy
// API requests to the Python backend. Breaking this will cause "Not Found" errors
// on Login and Register pages.

describe('Critical Configuration Check', () => {
  it('should have API proxy rewrite configured', async () => {
    // @ts-ignore - rewrites might not be in the type definition if not awaited, but we know it returns a promise or array
    const rewrites = await nextConfig.rewrites?.();
    
    assert.ok(rewrites, 'Rewrites configuration is missing in next.config.ts');
    
    const apiRewrite = Array.isArray(rewrites) 
      ? rewrites.find((r: any) => r.source === '/api/:path*')
      : rewrites.beforeFiles?.find((r: any) => r.source === '/api/:path*') || 
        rewrites.afterFiles?.find((r: any) => r.source === '/api/:path*') ||
        rewrites.fallback?.find((r: any) => r.source === '/api/:path*');

    assert.ok(apiRewrite, 'Missing critical rewrite rule for /api/:path*');
    assert.strictEqual(apiRewrite.destination, 'http://127.0.0.1:8000/api/:path*', 'API destination must point to backend port 8000');
  });
});
