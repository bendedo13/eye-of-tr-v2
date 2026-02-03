# FaceSeek.com Domain Configuration Guide

To correctly point your domain to the production server and ensure a premium SaaS experience, follow these steps:

## 1. DNS Records (Registrar Panel)
Add these records in your domain provider (GoDaddy, Namecheap, etc.):

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | [YOUR_SERVER_IP] | 3600 |
| CNAME | www | face-seek.com | 3600 |
| TXT | _google-site-verification | [IF_USING_SEARCH_CONSOLE] | Auto |

## 2. SSL (HTTPS) Configuration
Since this is a security platform, **SSL is mandatory**.
- If using **Vercel**: Just connect the domain; SSL is automatic.
- If using **Nginx/VPS**: Run Certbot to get a free Let's Encrypt certificate:
  ```bash
  sudo certbot --nginx -d face-seek.com -d www.face-seek.com
  ```

## 3. Environment Variables
Ensure your production `.env` files are updated:
- **Frontend**: `NEXT_PUBLIC_API_URL=https://api.face-seek.com`
- **Backend**: `ALLOWED_ORIGINS=https://face-seek.com,https://www.face-seek.com`

## 4. Branding Checklist (Completed)
- [x] All "Eye of TR" mentions replaced.
- [x] Footer navigation with Legal Hub.
- [x] Multi-engine trust badges added.
- [x] Professional About & Blog pages active.
