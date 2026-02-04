import asyncio
import sys
import os
import unittest
from unittest.mock import MagicMock, patch, AsyncMock

# Backend dizinini path'e ekle
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.openai_service import OpenAIService
from app.services.search_service import SearchService

class TestOpenAIIntegration(unittest.IsolatedAsyncioTestCase):
    
    def setUp(self):
        self.openai_service = OpenAIService()
        # Mock OpenAI API Key to bypass enabled check if env var missing
        self.openai_service.api_key = "sk-test-key"
        self.openai_service.enabled = True

    @patch("openai.ChatCompletion.acreate", new_callable=AsyncMock)
    async def test_analyze_search_results(self, mock_create):
        # Mock OpenAI response
        mock_create.return_value.choices = [
            MagicMock(message=MagicMock(content="Analiz Raporu: Şüpheli tespit edildi."))
        ]
        
        result = await self.openai_service.analyze_search_results("test query", ["result1"])
        
        self.assertEqual(result, "Analiz Raporu: Şüpheli tespit edildi.")
        mock_create.assert_called_once()

    @patch("openai.ChatCompletion.acreate", new_callable=AsyncMock)
    async def test_get_failure_message_privacy(self, mock_create):
        mock_create.return_value.choices = [
            MagicMock(message=MagicMock(content="Kişi verilerini korumaya almıştır."))
        ]
        
        msg = await self.openai_service.get_failure_message("privacy", context="Target")
        
        self.assertIn("korumaya almıştır", msg)
        # Sistem mesajının doğru gönderildiğini kontrol et (Privacy uzmanı rolü)
        call_args = mock_create.call_args[1]['messages']
        self.assertTrue(any("gizlilik ve güvenlik uzmanısın" in m['content'] for m in call_args))

    @patch("openai.ChatCompletion.acreate", new_callable=AsyncMock)
    async def test_get_failure_message_resolution(self, mock_create):
        mock_create.return_value.choices = [
            MagicMock(message=MagicMock(content="Fotoğraf çok bulanık."))
        ]
        
        msg = await self.openai_service.get_failure_message("resolution")
        self.assertEqual(msg, "Fotoğraf çok bulanık.")

    def test_fallback_messages(self):
        # API Key yokken fallback çalışmalı
        self.openai_service.api_key = None
        
        loop = asyncio.new_event_loop()
        msg = loop.run_until_complete(self.openai_service.get_failure_message("resolution"))
        loop.close()
        
        self.assertIn("çözünürlüğünden dolayı", msg)

if __name__ == "__main__":
    unittest.main()
