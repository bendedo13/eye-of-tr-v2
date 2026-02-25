
# Pricing plans - Türkçe karakter ve yeni fiyatlar
PRICING_PLANS = {
    "free": {
        "name": "Ücretsiz",
        "monthly_searches": 5,
        "credit_searches": 0,
        "price_usd": 0,
        "price_try": 0,
        "features": [
            "Günde 5 arama",
            "Temel AlanSearch",
            "Arama geçmişi",
        ]
    },
    "monthly": {
        "name": "Aylık",
        "monthly_searches": 500,
        "credit_searches": 0,
        "price_usd": 14.99,
        "price_try": 299,
        "features": [
            "Aylık 500 arama",
            "Gelişmiş AlanSearch",
            "Konum araması",
            "Arama geçmişi",
            "CSV export",
            "Öncelikli destek",
        ]
    },
    "credits": {
        "name": "Kredi Paketi",
        "monthly_searches": 0,
        "credit_searches": 100,
        "price_usd": 2,
        "price_try": 100,
        "features": [
            "100 arama kredisi",
            "Süresi sınırsız",
            "İstediğin zaman kullan",
            "AlanSearch + Konum araması",
        ]
    },
    "professional": {
        "name": "Profesyonel",
        "monthly_searches": 2000,
        "credit_searches": 0,
        "price_usd": 49.99,
        "price_try": 999,
        "features": [
            "Aylık 2000 arama",
            "Tüm özellikler",
            "API erişimi",
            "Toplu arama",
            "Dedike destek",
        ]
    }
}
