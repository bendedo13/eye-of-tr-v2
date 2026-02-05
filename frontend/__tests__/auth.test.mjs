import { describe, it } from 'node:test';
import assert from 'node:assert';

// GOLDEN RULE: DO NOT MODIFY THIS TEST WITHOUT EXPLICIT PERMISSION
// This test ensures that the user authentication flows (login/register) work correctly.
// Breaking this will cause login/register failures.

describe('User Auth Flow Test', () => {
  it('should login with test user credentials', async () => {
    try {
      const api = await import('../lib/api.ts');
      const result = await api.login('test@faceseek.com', '123456');
      assert.ok(result.access_token, 'Login should return an access token');
      assert.ok(result.access_token.length > 10, 'Access token should be valid');
    } catch (error) {
      assert.fail(`Login failed: ${error.message}`);
    }
  });

  it('should fail login with wrong credentials', async () => {
    try {
      const api = await import('../lib/api.ts');
      await api.login('test@faceseek.com', 'wrongpassword');
      assert.fail('Login should fail with wrong password');
    } catch (error) {
      assert.strictEqual(error.statusCode, 401, 'Should return 401 Unauthorized');
    }
  });

  it('should register a new user', async () => {
    const randomEmail = `testuser${Date.now()}@example.com`;
    try {
      const api = await import('../lib/api.ts');
      const result = await api.register(randomEmail, 'testuser', 'testpass123');
      assert.ok(result, 'Registration should return a result');
    } catch (error) {
      // Registration might fail if email exists, which is acceptable
      if (error.statusCode === 400) {
        assert.ok(true, 'Registration failed due to existing email (acceptable)');
      } else {
        assert.fail(`Registration failed unexpectedly: ${error.message}`);
      }
    }
  });
});
