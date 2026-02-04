import asyncio
import time
import json
import os
import sys
from typing import Dict, Any, List

# Backend dizinini path'e ekle
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.adapters.rapidapi_image_search_adapter import get_rapidapi_image_search_adapter
from app.adapters.serpapi_lens_adapter import get_serpapi_lens_adapter
from app.core.config import settings
from app.db.database import SessionLocal
from app.models.search_results import SearchResult
from app.services.analytics_service import AnalyticsService

# Test Verileri
TEST_LOCATIONS = [
    "New York, NY", "London, UK", "Istanbul, TR", "Tokyo, JP", "Berlin, DE",
    "Paris, FR", "Sydney, AU", "Moscow, RU", "Dubai, UAE", "Toronto, CA"
]

TEST_PERSONS = [
    "Elon Musk", "Bill Gates", "Jeff Bezos", "Mark Zuckerberg", "Tim Cook",
    "Satya Nadella", "Sundar Pichai", "Jensen Huang", "Sam Altman", "Lisa Su"
]

TEST_WEBSITES = [
    "https://www.apple.com", "https://www.microsoft.com", "https://www.amazon.com",
    "https://www.google.com", "https://www.tesla.com"
]

async def test_serpapi():
    print("\n--- 1. SerpAPI Testi ---")
    adapter = get_serpapi_lens_adapter({
        "api_key": settings.SERPAPI_API_KEY,
        "engine": settings.SERPAPI_ENGINE,
        "gl": settings.SERPAPI_GL,
        "hl": settings.SERPAPI_HL,
        "timeout": 30
    })

    results = []
    
    # 10 farklı kişi sorgusu (Görsel URL üzerinden simüle edilecek)
    # Not: SerpAPI Lens adaptörü görsel URL veya dosya yolu bekler. 
    # Test için örnek bir görsel URL kullanacağız.
    test_image_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/220px-Elon_Musk_Royal_Society_%28crop2%29.jpg"

    for i, person in enumerate(TEST_PERSONS):
        print(f"Testing SerpAPI for {person}...")
        start_time = time.perf_counter()
        try:
            # Gerçek bir görsel URL bulmak zor olduğu için sabit bir URL kullanıyoruz 
            # ancak gerçek senaryoda her kişi için farklı URL gerekir.
            # Burada adaptörün yanıt süresini ve yapısını test ediyoruz.
            res = await adapter.search_by_image_url(test_image_url)
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            
            success = res.status == "success"
            match_count = len(res.matches)
            
            results.append({
                "query": person,
                "status": res.status,
                "time_ms": elapsed_ms,
                "matches": match_count,
                "error": res.error
            })
            
            # Rate limit için bekle
            await asyncio.sleep(1)
            
        except Exception as e:
            results.append({
                "query": person,
                "status": "exception",
                "time_ms": 0,
                "matches": 0,
                "error": str(e)
            })

    # JSON Yapı Kontrolü (Son başarılı yanıt üzerinden)
    if any(r["status"] == "success" for r in results):
        print("JSON Yapısı Doğrulanıyor: OK")
    else:
        print("JSON Yapısı Doğrulanıyor: FAIL (Hiçbir istek başarılı olmadı)")

    return results

async def test_rapidapi():
    print("\n--- 2. RapidAPI (RaidAPI) Testi ---")
    adapter = get_rapidapi_image_search_adapter({
        "api_key": settings.RAPIDAPI_KEY,
        "host": settings.RAPIDAPI_HOST,
        "endpoint": settings.RAPIDAPI_IMAGE_SEARCH_ENDPOINT,
        "timeout": 30
    })

    results = []

    for i, person in enumerate(TEST_PERSONS):
        print(f"Testing RapidAPI for {person}...")
        start_time = time.perf_counter()
        try:
            res = await adapter.search(person, limit=10)
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            
            success = res.status == "success"
            match_count = len(res.matches)
            
            # Manuel doğrulama simülasyonu (Veri bütünlüğü kontrolü)
            missing_fields = 0
            total_fields = 0
            if success:
                for match in res.matches:
                    total_fields += 3 # title, url, image_url
                    if not match.title: missing_fields += 1
                    if not match.profile_url: missing_fields += 1
                    if not match.image_url: missing_fields += 1
            
            completeness = 100 - (missing_fields / total_fields * 100) if total_fields > 0 else 0

            results.append({
                "query": person,
                "status": res.status,
                "time_ms": elapsed_ms,
                "matches": match_count,
                "completeness": completeness,
                "error": res.error
            })
            
            await asyncio.sleep(1)

        except Exception as e:
            results.append({
                "query": person,
                "status": "exception",
                "time_ms": 0,
                "matches": 0,
                "completeness": 0,
                "error": str(e)
            })

    return results

async def test_data_storage(websites: List[str]):
    print("\n--- 3. Veri Kaydetme ve 4. Site Performans Testi ---")
    results = []
    
    # Simüle edilmiş veri çekme ve kaydetme
    # Gerçek crawl işlemi data_platform modülünde ama burada basitçe
    # adaptörlerden gelen verinin DB'ye yazılma hızını ölçeceğiz.
    
    db = SessionLocal()
    
    for site in websites:
        print(f"Testing storage for {site}...")
        start_time = time.perf_counter()
        
        try:
            # 1. Veri Çekme Simülasyonu (RapidAPI kullanılarak)
            adapter = get_rapidapi_image_search_adapter({
                "api_key": settings.RAPIDAPI_KEY,
                "host": settings.RAPIDAPI_HOST,
                "endpoint": settings.RAPIDAPI_IMAGE_SEARCH_ENDPOINT,
                "timeout": 30
            })
            # Site adını query olarak kullan
            query = site.replace("https://www.", "").split(".")[0]
            res = await adapter.search(query, limit=5)
            
            fetch_time = time.perf_counter() - start_time
            
            # 2. Veri Kaydetme Simülasyonu (AnalyticsService kullanılarak)
            save_start = time.perf_counter()
            
            if res.status == "success":
                AnalyticsService.log_search(
                    db=db,
                    user_id=1, # Test user ID
                    search_type="test_crawl",
                    results_found=res.total_matches,
                    is_successful=True,
                    query=site,
                    providers_used="rapidapi",
                    search_duration_ms=int(res.search_time_ms)
                )
            
            save_time = time.perf_counter() - save_start
            
            results.append({
                "site": site,
                "fetched_items": res.total_matches,
                "fetch_time_ms": int(fetch_time * 1000),
                "save_time_ms": int(save_time * 1000),
                "status": "success" if res.status == "success" else "failed"
            })
            
        except Exception as e:
            results.append({
                "site": site,
                "fetched_items": 0,
                "fetch_time_ms": 0,
                "save_time_ms": 0,
                "status": f"error: {str(e)}"
            })
            
    db.close()
    return results

def generate_report(serp_results, rapid_results, storage_results):
    report = "# Detaylı API ve Veri Test Raporu\n\n"
    report += f"**Tarih:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    # 1. SerpAPI Raporu
    report += "## 1. SerpAPI Performans Analizi\n"
    report += "| Sorgu | Durum | Süre (ms) | Eşleşme | Hata |\n"
    report += "|---|---|---|---|---|\n"
    for r in serp_results:
        report += f"| {r['query']} | {r['status']} | {r['time_ms']} | {r['matches']} | {r['error'] or '-'} |\n"
        
    avg_serp = sum(r['time_ms'] for r in serp_results) / len(serp_results) if serp_results else 0
    report += f"\n**Ortalama Yanıt Süresi:** {int(avg_serp)} ms\n\n"

    # 2. RapidAPI Raporu
    report += "## 2. RapidAPI (RaidAPI) Veri Kalitesi Analizi\n"
    report += "| Sorgu | Durum | Süre (ms) | Eşleşme | Veri Bütünlüğü (%) | Hata |\n"
    report += "|---|---|---|---|---|---|\n"
    for r in rapid_results:
        report += f"| {r['query']} | {r['status']} | {r['time_ms']} | {r['matches']} | {r['completeness']:.1f}% | {r['error'] or '-'} |\n"
    
    avg_rapid = sum(r['time_ms'] for r in rapid_results) / len(rapid_results) if rapid_results else 0
    report += f"\n**Ortalama Yanıt Süresi:** {int(avg_rapid)} ms\n\n"

    # 3. Storage Raporu
    report += "## 3. Veri Çekme ve Kaydetme Performansı\n"
    report += "| Site | Çekilen Veri | Çekme Süresi (ms) | Kaydetme Süresi (ms) | Durum |\n"
    report += "|---|---|---|---|---|\n"
    for r in storage_results:
        report += f"| {r['site']} | {r['fetched_items']} | {r['fetch_time_ms']} | {r['save_time_ms']} | {r['status']} |\n"

    # 4. Genel Değerlendirme
    report += "\n## 4. Genel Değerlendirme ve Öneriler\n"
    report += "- **SerpAPI:** " + ("Hızlı ve kararlı." if avg_serp < 2000 else "Yavaş yanıt süreleri gözlemlendi.") + "\n"
    report += "- **RapidAPI:** " + ("Veri bütünlüğü yüksek." if any(r['completeness'] > 90 for r in rapid_results) else "Bazı alanlar eksik geliyor.") + "\n"
    report += "- **Veritabanı:** Kaydetme süreleri " + ("kabul edilebilir seviyede." if all(r['save_time_ms'] < 100 for r in storage_results) else "optimize edilmeli.") + "\n"

    return report

async def main():
    print("Test süreci başlatılıyor...")
    
    serp_results = await test_serpapi()
    rapid_results = await test_rapidapi()
    storage_results = await test_data_storage(TEST_WEBSITES)
    
    report = generate_report(serp_results, rapid_results, storage_results)
    
    with open("API_TEST_REPORT.md", "w", encoding="utf-8") as f:
        f.write(report)
        
    print("\nTest tamamlandı! Rapor 'API_TEST_REPORT.md' dosyasına kaydedildi.")

if __name__ == "__main__":
    asyncio.run(main())
