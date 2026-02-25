from typing import Dict, Any

PRICING_PLANS: Dict[str, Any] = {
    "free": {
        "name": "Ücretsiz",
        "price_try": 0,
        "price_usd": 0.0,
        "credits": 5,
        "monthly_credits": 5,
        "features": [
            "5 arama kredisi",
            "Temel yüz tanıma",
            "Google Dork arama",
            "Standart destek",
        ],
    },
    "monthly": {
        "name": "Aylık Plan",
        "price_try": 299,
        "price_usd": 14.99,
        "credits": 500,
        "monthly_credits": 500,
        "features": [
            "500 arama kredisi/ay",
            "Gelişmiş yüz tanıma",
            "Google Dork arama",
            "Konum bazlı arama",
            "Gelişmiş filtreler",
            "CSV dışa aktarma",
            "Öncelikli destek",
        ],
    },
    "credits": {
        "name": "Kr