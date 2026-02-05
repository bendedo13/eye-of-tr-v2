# AUTHENTICATION SYSTEM - CRITICAL PROTECTION GUIDE

## ⚠️ GOLDEN RULE: NEVER BREAK THESE CONFIGURATIONS

This document outlines the critical authentication components that must be preserved at all costs. Any changes to these systems require explicit approval and thorough testing.

## 🔐 Critical Components

### 1. Frontend API Proxy Configuration
**File:** `frontend/next.config.ts`
**Purpose:** Routes all `/api/*` requests to the backend server
**Critical Rule:** Must maintain the rewrite rule for `/api/:path*`
```typescript
async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: "http://127.0.0.1:8000/api/:path*", // DO NOT CHANGE
    },
  ];
}
```

### 2. Backend Authentication Routes
**Files:** 
- `backend/app/api/auth.py`
- `backend/app/api/admin.py`

**Critical Endpoints:**
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/me` - Current user info
- `/api/admin/ping` - Admin authentication

### 3. Frontend Authentication Context
**File:** `frontend/context/AuthContext.tsx`
**Purpose:** Manages user authentication state
**Critical Functions:**
- `login()` - Must handle token storage correctly
- `register()` - Must handle verification flow
- Token storage in localStorage

### 4. API Client Libraries
**Files:**
- `frontend/lib/api.ts` - User API client
- `frontend/lib/adminApi.ts` - Admin API client

**Critical Features:**
- Automatic token attachment
- Error handling for auth failures
- Timeout handling

## 🧪 Testing Requirements

### Before Any Changes:
1. Run authentication tests: `npm run test:auth`
2. Run admin tests: `npm run test:admin`
3. Run configuration tests: `npm run test:config`
4. Manual test user registration and login
5. Manual test admin login

### Test Users:
- **Regular User:** `test@faceseek.com` / `123456`
- **Admin User:** `admin@faceseek.io` / `admin_password_123`

## 🚨 Breaking Change Indicators

### Frontend Issues:
- "Not Found" errors on login/register
- API calls returning 404
- Authentication state not persisting
- Token not being attached to requests

### Backend Issues:
- Database relationship errors
- Missing model imports
- Authentication middleware failures

## 🔧 Safe Modification Guidelines

### Allowed Changes:
- UI/UX improvements (colors, layout, animations)
- Additional form validation
- Error message improvements
- Performance optimizations

### Forbidden Changes:
- API endpoint URLs
- Authentication flow logic
- Token handling mechanisms
- Database schema relationships
- Proxy configuration

## 📋 Pre-Deployment Checklist

- [ ] All authentication tests pass
- [ ] User can register successfully
- [ ] User can login successfully
- [ ] Admin can login successfully
- [ ] Protected routes work correctly
- [ ] Token refresh works
- [ ] Logout functionality works

## 🛡️ Emergency Recovery

If authentication breaks:
1. Check `next.config.ts` proxy configuration
2. Verify backend is running on port 8000
3. Check database connections
4. Verify model relationships in `backend/app/models/`
5. Check API client imports and configurations

## 📞 Contact

Before making any changes to authentication systems, contact the system administrator for approval and guidance.

---
**Last Updated:** $(date)
**Version:** 1.0
**Status:** CRITICAL PROTECTION ACTIVE