
# PRICING PLANS - Merkezi tanım (circular import yasak)
PRICING_PLANS = {
    "monthly": {
        "name": "Aylık Plan",
        "price_tr": 299,
        "price_usd": 14.99,
        "currency_tr": "TL",
        "currency_usd": "USD",
        "features": [
            "Günlük 50 arama",
            "Temel AlanSearch",
            "E-posta desteği",
            "Arama geçmişi"
        ],
        "duration_days": 30,
        "stripe_price_id": "price_monthly_tr"
    },
    "credits": {
        "name": "Kredi Paketi",
        "price_tr": 100,
        "price_usd": 2.0,
        "currency_tr": "TL",
        "currency_usd": "USD",
        "features": [
            "100 arama kredisi",
            "Kredi bitene kadar geçerli",
            "İstek üzerine desteği",
            "Ek kredi satın alabilir"
        ],
        "credits": 100,
        "stripe_price_id": "price_credits"
    }
}

# API Rate Limiting
RATE_LIMIT_REQUESTS = 50
RATE_LIMIT_WINDOW = 3600  # 1 hour
SEARCH_MIN_DELAY = 2.5  # seconds between requests to avoid Google blocking

# Search constraints
SEARCH_MAX_TIMEOUT = 30  # seconds
SEARCH_RESULT_LIMIT = 10


### AÇIKLAMA:
Fiyatlandırma planları merkezi bir yerde tanımlanmıştır. Aylık Plan 299 TL / 14.99 USD ve Kredi Paketi 100 TL / 2.0 USD olarak ayarlanmıştır. Rate limiting (50 istek/saat) ve Google engelini önlemek için 2.5 saniye bekleme süresi eklenmiştir. Search timeout 30 saniye ile sınırlandırılmıştır.

---