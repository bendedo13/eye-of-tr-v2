# Real-Time Lens Data Integration Guide

## Overview
This module integrates RapidAPI's Real-Time Lens Data API to provide advanced face and location analysis.

## Features
- **Face Search**: Analyze faces for matches across the web.
- **Location Search**: Identify landmarks and locations.
- **Knowledge Graph**: Get detailed entity information.
- **Visual Matches**: See visually similar images from various sources.

## Integration Details
- **Backend**: Python/FastAPI (`/api/v1/lens-analysis`)
- **Frontend**: Next.js (`/lens`)
- **Database**: Postgres (`lens_analysis_logs` table)
- **External API**: RapidAPI (Real-Time Lens Data)

## Deployment Instructions

### 1. Update VPS
Connect to your VPS and run the update script:
```bash
ssh root@46.4.123.77
cd /opt/faceseek
./deploy/scripts/update_vps.sh
```

### 2. Verify Configuration
Ensure the following env vars are set (already configured in code defaults, but recommended for .env):
```env
RAPIDAPI_LENS_KEY=e04cfd391dmsh5bad32e4055f7d3p1be7c6jsn2c85bac04ee7
RAPIDAPI_LENS_HOST=real-time-lens-data.p.rapidapi.com
```

### 3. Database Migration
The update script restarts the backend, which automatically creates the new `lens_analysis_logs` table via SQLAlchemy's `create_all`. No manual migration needed.

## Testing
1. Go to `https://face-seek.com/lens` (or `/tr/lens`).
2. Login if required.
3. Upload an image (e.g., Eiffel Tower or a celebrity face).
4. Select "Face Search" or "Location Search".
5. View results.

## Troubleshooting
- **API Errors**: Check backend logs (`journalctl -u faceseek-backend -f`).
- **400 Bad Request**: Ensure image is JPG/PNG/PDF and < 5MB.
- **500 Internal Error**: Check RapidAPI quota or connectivity.
