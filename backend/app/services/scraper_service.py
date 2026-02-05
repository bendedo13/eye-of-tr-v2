import os
import time
import requests
import uuid
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from app.core.config import settings

class ScraperService:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR) / "scraped"
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def scrape_images(self, target_url: str, max_images: int = 100):
        """
        Belirtilen URL'den görselleri çeker.
        """
        domain = urlparse(target_url).netloc
        safe_domain = "".join([c if c.isalnum() else "_" for c in domain])
        target_dir = self.upload_dir / safe_domain
        target_dir.mkdir(parents=True, exist_ok=True)

        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        })

        try:
            response = session.get(target_url, timeout=10)
            response.raise_for_status()
        except Exception as e:
            return {"status": "error", "message": str(e)}

        soup = BeautifulSoup(response.text, "html.parser")
        img_tags = soup.find_all("img")

        count = 0
        results = []
        start_time = time.time()

        for img in img_tags:
            if count >= max_images:
                break
            
            src = img.get("src")
            if not src:
                continue
            
            full_url = urljoin(target_url, src)
            
            # Basit filtreleme (ikon, svg vb. atla)
            if full_url.endswith(".svg") or "icon" in full_url.lower() or "logo" in full_url.lower():
                continue

            try:
                img_data = session.get(full_url, timeout=5).content
                if len(img_data) < 5000: # 5KB altı görselleri atla
                    continue
                
                ext = Path(full_url).suffix
                if not ext or len(ext) > 5:
                    ext = ".jpg"
                
                filename = f"{uuid.uuid4()}{ext}"
                file_path = target_dir / filename
                file_path.write_bytes(img_data)
                
                results.append({
                    "url": full_url,
                    "local_path": f"/uploads/scraped/{safe_domain}/{filename}",
                    "filename": filename
                })
                count += 1
                
            except Exception:
                continue

        duration = time.time() - start_time
        
        return {
            "status": "success",
            "domain": domain,
            "total_found": len(img_tags),
            "total_downloaded": count,
            "duration_seconds": round(duration, 2),
            "images": results
        }

scraper_service = ScraperService()
