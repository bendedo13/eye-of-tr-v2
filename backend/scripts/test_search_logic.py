import asyncio
import os
import sys

# Backend dizinine erişim sağla
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.openai_service import get_openai_service

async def test_failure_message():
    service = get_openai_service()
    if not service.is_available():
        print("Skipping test: OpenAI service not available")
        return

    print("Testing 'privacy' failure message generation...")
    msg = await service.get_failure_message("privacy", context="Erdoğan")
    print(f"Message: {msg}")
    
    if "korumaya almış" in msg or "protected" in msg:
        print("✅ Success: Privacy message generated correctly")
    else:
        print("⚠️ Warning: Message content unexpected")

if __name__ == "__main__":
    asyncio.run(test_failure_message())
