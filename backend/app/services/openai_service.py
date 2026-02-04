import openai
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.enabled = settings.OPENAI_ENABLED
        self.model = settings.OPENAI_MODEL or "gpt-4o-mini"
        
        if self.enabled and self.api_key:
            openai.api_key = self.api_key

    async def analyze_search_results(self, query: str, results: list) -> str:
        """Arama sonuçlarını analiz edip özet çıkarır"""
        if not self.enabled or not self.api_key:
            return "AI analizi devre dışı (API Key eksik)."

        try:
            prompt = f"""
            Aşağıdaki arama sonuçlarını analiz et ve kullanıcı için profesyonel, merak uyandırıcı kısa bir özet yaz.
            Sanki bir istihbarat raporu sunuyormuş gibi resmi ama etkileyici bir dil kullan.
            
            Aranan: {query}
            Sonuçlar: {str(results)[:2000]}... (kısaltıldı)
            
            Özet:
            """
            
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=250
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI analysis failed: {e}")
            return "AI analizi şu anda yapılamıyor."

    async def get_failure_message(self, failure_type: str, context: Optional[str] = None) -> str:
        """Başarısızlık durumları için özel mesaj üretir"""
        if not self.enabled or not self.api_key:
            # Fallback mesajlar
            if failure_type == "resolution":
                return "Sonuç fotoğraf çözünürlüğünden dolayı bulunamadı. Lütfen daha yüksek çözünürlüklü bir görsel yükleyin."
            elif failure_type == "privacy":
                return "Aradığınız kişi kendi verisini korumaya almış ve ücretli olarak kendisini koruyor."
            return "Sonuç bulunamadı."

        try:
            if failure_type == "resolution":
                system_msg = "Sen profesyonel bir görüntü analiz asistanısın."
                prompt = "Kullanıcıya fotoğraf çözünürlüğü yetersiz olduğu için yüz tanımanın başarısız olduğunu, daha net bir fotoğraf yüklemesi gerektiğini söyleyen kısa, profesyonel bir hata mesajı yaz."
            
            elif failure_type == "privacy":
                system_msg = "Sen gizlilik ve güvenlik uzmanısın."
                prompt = f"Kullanıcı '{context}' kişisini aradı ancak sonuç yok. Kullanıcıya 'Aradığınız kişi kendi verisini korumaya almış ve ücretli olarak kendisini koruyor' mesajını temel alan, çok profesyonel ve gizemli bir uyarı metni yaz."
            
            else:
                return "Arama kriterlerine uygun sonuç bulunamadı."

            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100
            )
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            logger.error(f"OpenAI failure message generation failed: {e}")
            # Hata durumunda hardcoded fallback
            if failure_type == "resolution":
                return "Sonuç fotoğraf çözünürlüğünden dolayı bulunamadı."
            elif failure_type == "privacy":
                return "Aradığınız kişi kendi verisini korumaya almış ve ücretli olarak kendisini koruyor."
            return "Sonuç bulunamadı."

openai_service = OpenAIService()
