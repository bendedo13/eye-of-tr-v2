"""AlanSearch - General OSINT search module.

Multi-platform person search across social media, websites, and public databases.
Each registered user gets 1 free AlanSearch credit.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alan-search", tags=["alan-search"])


# OSINT platform configurations
OSINT_PLATFORMS = [
    {
        "id": "google",
        "name": "Google",
        "icon": "search",
        "query_template": '"{name}" site:{domain}',
        "domains": [],
    },
    {
        "id": "linkedin",
        "name": "LinkedIn",
        "icon": "linkedin",
        "query_template": 'site:linkedin.com/in/ "{name}"',
        "domains": ["linkedin.com"],
    },
    {
        "id": "twitter",
        "name": "Twitter/X",
        "icon": "twitter",
        "query_template": 'site:twitter.com OR site:x.com "{name}"',
        "domains": ["twitter.com", "x.com"],
    },
    {
        "id": "instagram",
        "name": "Instagram",
        "icon": "instagram",
        "query_template": 'site:instagram.com "{name}"',
        "domains": ["instagram.com"],
    },
    {
        "id": "facebook",
        "name": "Facebook",
        "icon": "facebook",
        "query_template": 'site:facebook.com "{name}"',
        "domains": ["facebook.com"],
    },
    {
        "id": "github",
        "name": "GitHub",
        "icon": "github",
        "query_template": 'site:github.com "{name}"',
        "domains": ["github.com"],
    },
    {
        "id": "reddit",
        "name": "Reddit",
        "icon": "message-circle",
        "query_template": 'site:reddit.com/user/ "{name}"',
        "domains": ["reddit.com"],
    },
    {
        "id": "youtube",
        "name": "YouTube",
        "icon": "youtube",
        "query_template": 'site:youtube.com "{name}"',
        "domains": ["youtube.com"],
    },
]


class AlanSearchRequest(BaseModel):
    query: str
    platforms: list[str] = []  # Empty = all platforms
    region: Optional[str] = None


class AlanSearchResult(BaseModel):
    platform: str
    platform_name: str
    query_url: str
    icon: str


@router.get("/credits")
def get_alan_search_credits(
    user: User = Depends(get_current_user),
):
    """Get user's AlanSearch credit count."""
    return {
        "credits": user.alan_search_credits,
    }


@router.get("/platforms")
def get_platforms():
    """Get available OSINT search platforms."""
    return {
        "platforms": [
            {"id": p["id"], "name": p["name"], "icon": p["icon"]}
            for p in OSINT_PLATFORMS
        ]
    }


@router.post("/search")
def alan_search(
    data: AlanSearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Execute AlanSearch - generates OSINT search queries across platforms.

    Consumes 1 AlanSearch credit per search.
    Returns search URLs for each platform (user opens them manually).
    """
    if not data.query or len(data.query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search query too short")

    # Credit Validation Flow:
    # 1. Check if user has sufficient credits (unless unlimited tier)
    # 2. Reject request with 402 Payment Required if credits <= 0
    # 3. Only consume credit AFTER validation passes
    # 4. Unlimited tier users bypass credit checks entirely
    
    # Step 1 & 2: Validate sufficient credits
    if user.alan_search_credits <= 0 and user.tier != "unlimited":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No AlanSearch credits remaining"
        )

    # Step 3: Consume credit after validation (unlimited tier bypasses)
    if user.tier != "unlimited":
        user.alan_search_credits -= 1
        db.commit()

    query = data.query.strip()
    selected_platforms = data.platforms if data.platforms else [p["id"] for p in OSINT_PLATFORMS]

    results = []
    for platform in OSINT_PLATFORMS:
        if platform["id"] not in selected_platforms:
            continue

        # Generate Google search URL for this platform
        if platform["domains"]:
            search_query = f'site:{platform["domains"][0]} "{query}"'
        else:
            search_query = f'"{query}"'

        # Add region filter
        region_param = f"&gl={data.region}" if data.region else ""

        search_url = (
            f"https://www.google.com/search?q={search_query.replace(' ', '+')}"
            f"{region_param}"
        )

        results.append({
            "platform": platform["id"],
            "platform_name": platform["name"],
            "query_url": search_url,
            "icon": platform["icon"],
        })

    logger.info(f"AlanSearch: user={user.email}, query='{query}', platforms={len(results)}")

    return {
        "status": "success",
        "query": query,
        "credits_remaining": user.alan_search_credits,
        "results": results,
    }
