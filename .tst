PROJECT NAME:
EyeOfTR – Face Search SaaS Platform

PROJECT PURPOSE:
This project is a professional SaaS web application for facial image search.
It integrates external facial search APIs (EyeOfWeb, FaceCheck ID, PimEyes-like services).
Users upload images, the backend processes requests, sends them to APIs, and returns matches.
Authentication, subscriptions, and API-based billing are core features.

CORE RULE (CRITICAL):
Before making ANY change, you MUST read this file entirely.
If a requested change conflicts with these rules, STOP and ask for clarification.

────────────────────────────────
TECH STACK (DO NOT CHANGE)
────────────────────────────────
Backend Language: Python
Backend Framework: FastAPI (Modern Async Framework)
Auth: python-jose (JWT Authentication)
API Integrations: REST (JSON)
Environment: venv
Deployment Target: VPS (Linux)
Frontend: Next.js (TypeScript/React)
Payments: LemonSqueezy (Variant ID based)
Face APIs: EyeOfWeb, FaceCheck ID (external services)

DO NOT:
- Migrate FastAPI to Flask or Django
- Change programming language
- Replace authentication system
- Rename folders or core files
- Remove existing API logic

────────────────────────────────
PROJECT STRUCTURE (IMMUTABLE)
────────────────────────────────
/backend
 ├── main.py  (FastAPI app entry point)
 ├── app/
 │   ├── __init__.py
 │   ├── core/
 │   │   ├── config.py
 │   │   └── security.py
 │   ├── api/  (route endpoints)
 │   ├── services/
 │   ├── models/
 │   ├── db/
 │   └── schemas/
 ├── requirements.txt
 └── .env

/frontend
 ├── Next.js application
 └── .env

Folder structure MUST remain intact.

────────────────────────────────
CHANGE POLICY (VERY IMPORTANT)
────────────────────────────────
1. Only modify files that are DIRECTLY related to the requested change.
2. NEVER touch unrelated files.
3. NEVER refactor for "cleanliness" unless explicitly requested.
4. NEVER add features on your own initiative.
5. If a fix can be done in one file, DO NOT touch others.
6. All changes must be MINIMAL, TARGETED, and REVERSIBLE.

────────────────────────────────
ERROR HANDLING RULES
────────────────────────────────
- Do not silence errors.
- Log errors clearly.
- Do not add try/except blocks unless requested.
- Never hide API errors from the backend.

────────────────────────────────
DEPENDENCY RULES
────────────────────────────────
- Only add a dependency if absolutely required.
- If adding a dependency:
  - Explain WHY
  - Update requirements.txt ONLY
- Never remove existing dependencies.

────────────────────────────────
API INTEGRATION RULES
────────────────────────────────
- Do not hardcode API keys.
- Use environment variables (.env).
- Do not change existing API request logic unless explicitly told.
- FaceCheck ID integration must be added as a new service module.

────────────────────────────────
SECURITY RULES
────────────────────────────────
- JWT logic must remain intact.
- No debug mode in production logic.
- Do not expose secrets in logs or responses.

────────────────────────────────
FINAL CHECK (MANDATORY)
────────────────────────────────
Before finishing:
- Confirm which files were modified
- Confirm no other files were touched
- Confirm project structure is unchanged
- Confirm no breaking changes were introduced
