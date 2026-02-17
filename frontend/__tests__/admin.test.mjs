import { describe, it } from 'node:test';
import assert from 'node:assert';

// GOLDEN RULE: DO NOT MODIFY THIS TEST WITHOUT EXPLICIT PERMISSION
// This test ensures that the admin authentication flow works correctly.
// Breaking this will cause admin login failures.

describe('Admin Auth Flow Test', () => {
  it('should authenticate admin with correct key', async () => {
    try {
      const adminApi = await import('../lib/adminApi.ts');
      const result = await adminApi.adminPing('Benalan.1');
      assert.strictEqual(result.status, 'ok', 'Admin ping should return status ok');
    } catch (error) {
      assert.fail(`Admin authentication failed: ${error.message}`);
    }
  });

  it('should fail admin authentication with wrong key', async () => {
    try {
      const adminApi = await import('../lib/adminApi.ts');
      await adminApi.adminPing('wrong_admin_key');
      assert.fail('Admin authentication should fail with wrong key');
    } catch (error) {
      assert.strictEqual(error.statusCode, 401, 'Should return 401 Unauthorized');
    }
  });
});
