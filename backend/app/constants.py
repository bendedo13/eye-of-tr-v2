
# Pricing Plans - Circular import'tan korumalı
PRICING_PLANS = {
    "free": {
        "name": "Ücretsiz",
        "searches_per_day": 5,
        "monthly_price_try": 0,
        "monthly_price_usd": 0,
        "features": ["Günde 5 arama", "Temel AlanSearch"]
    },
    "premium": {
        "name": "Premium",
        "searches_per_day": None,  # Sınırsız
        "monthly_price_try": 299,
        "monthly_price_usd": 14.99,
        "features": ["Sınırsız arama", "Gelişmiş filtreleme", "Hızlı sonuçlar"]
    },
    "credits": {
        "name": "Kredi Paketi",
        "credits": 100,
        "validity_days": 180,
        "price_try": 100,
        "price_usd": 2,
        "features": ["100 arama kredisi", "6 ay geçerlilik"]
    }
}
