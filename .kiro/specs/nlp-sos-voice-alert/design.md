# Design Document: NLP-Powered Smart S.O.S Voice Alert

## Overview

The NLP-Powered Smart S.O.S feature enables voice-based emergency reporting during earthquakes. The system consists of three main components: a mobile voice recorder (React Native), a backend processing pipeline (FastAPI + Celery), and AI services for speech-to-text and data extraction. The design prioritizes reliability and speed, with comprehensive fallback mechanisms to ensure emergency notifications are sent even when AI services fail.

### Key Design Decisions

1. **Asynchronous Processing**: Use Celery for background processing to provide immediate feedback to users while AI services process audio
2. **Fallback Strategy**: Multi-level fallback ensures notifications are sent even if Whisper or LLM services fail
3. **Audio Storage**: Store audio files with signed URLs for emergency responder access
4. **Integration**: Leverage existing Emergency Contact Alert system for notification delivery
5. **Turkish Language Support**: Configure all AI services for Turkish language processing

## Architecture

### System Components

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
│                 │
│  - Voice UI     │
│  - Audio Rec    │
│  - Upload       │
└────────┬────────┘
         │ HTTP POST /api/v1/sos/analyze
         │ (multipart/form-data)
         ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (FastAPI)                                      │
│                                                         │
│  ┌──────────────┐    ┌─────────────────────────────┐  │
│  │ API Endpoint │───▶│ Celery Task Queue (Redis)   │  │
│  │ /sos/analyze │    │                             │  │
│  └──────────────┘    └────────┬────────────────────┘  │
│         │                      │                        │
│         │ 202 Accepted         │ Async Processing       │
│         │ (task_id)            ▼                        │
│         │            ┌──────────────────────┐          │
│         │            │  SOS Analyzer Task   │          │
│         │            │                      │          │
│         │            │  1. Save audio file  │          │
│         │            │  2. Call Whisper API │          │
│         │            │  3. Call LLM API     │          │
│         │            │  4. Save to DB       │          │
│         │            │  5. Send alerts      │          │
│         │            └──────┬───────────────┘          │
│         │                   │                           │
│         │                   ▼                           │
│         │         ┌──────────────────┐                 │
│         │         │ Fallback Handler │                 │
│         │         │ (on AI failure)  │                 │
│         │         └──────────────────┘                 │
└─────────┼─────────────────┬───────────────────────────┘
          │                 │
          ▼                 ▼
┌──────────────────┐  ┌─────────────────────────┐
│ Push Notification│  │ Emergency Contact Alert │
│ (Processing Done)│  │ System (SMS/WhatsApp)   │
└──────────────────┘  └─────────────────────────┘

External Services:
┌─────────────────┐  ┌─────────────────┐
│ Whisper API     │  │ LLM API         │
│ (Speech-to-Text)│  │ (Claude/OpenAI) │
└─────────────────┘  └─────────────────┘
```

### Data Flow

1. **Recording Phase**: User presses button → Mobile app records audio → Audio encoded as MP3/M4A
2. **Upload Phase**: Mobile app sends multipart request with audio + metadata → Backend returns 202 + task_id
3. **Processing Phase**: 
   - Celery task saves audio to storage
   - Calls Whisper API for transcription (10s timeout)
   - Calls LLM API for extraction (15s timeout)
   - Creates SOS_Record in PostgreSQL
4. **Notification Phase**: Backend triggers Emergency Contact Alert system with structured data
5. **Completion Phase**: Push notification sent to mobile app with extracted data

### Fallback Flow

```
Whisper API Call
    │
    ├─ Success → LLM API Call
    │               │
    │               ├─ Success → Full structured data
    │               │
    │               └─ Failure → Fallback: Send transcribed text only
    │
    └─ Failure → Fallback: Send raw audio URL only
```

## Components and Interfaces

### 1. Mobile App Components

#### VoiceRecorderButton Component (React Native)

```typescript
interface VoiceRecorderButtonProps {
  onRecordingComplete: (audioUri: string, duration: number) => void;
  onError: (error: Error) => void;
  maxDuration?: number; // default: 60 seconds
}

// State management
type RecordingState = 'idle' | 'recording' | 'uploading' | 'success' | 'error';

// Audio recording using expo-av
import { Audio } from 'expo-av';

// Methods:
// - startRecording(): Promise<void>
// - stopRecording(): Promise<string> // returns audio URI
// - uploadAudio(uri: string): Promise<SOSResponse>
```

#### SOSService (API Client)

```typescript
interface SOSAnalyzeRequest {
  audio_file: File | Blob;
  user_id: string;
  timestamp: string; // ISO 8601
  latitude: number;
  longitude: number;
}

interface SOSAnalyzeResponse {
  task_id: string;
  status: 'accepted';
  message: string;
}

interface SOSStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_data?: ExtractedSOSData;
  error_message?: string;
}

interface ExtractedSOSData {
  sos_id: string;
  durum: 'Enkaz Altında' | 'Güvende' | 'Bilinmiyor';
  kisi_sayisi: number;
  aciliyet: 'Kırmızı' | 'Sarı' | 'Yeşil';
  lokasyon: string;
  orijinal_metin: string;
}

class SOSService {
  async analyzeSOS(request: SOSAnalyzeRequest): Promise<SOSAnalyzeResponse>;
  async getSOSStatus(taskId: string): Promise<SOSStatusResponse>;
}
```

### 2. Backend Components

#### API Endpoints (FastAPI)

```python
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/sos", tags=["sos"])

class SOSAnalyzeResponse(BaseModel):
    task_id: str
    status: str
    message: str

class SOSStatusResponse(BaseModel):
    status: str  # pending, processing, completed, failed
    extracted_data: Optional[ExtractedSOSData]
    error_message: Optional[str]

class ExtractedSOSData(BaseModel):
    sos_id: str
    durum: str
    kisi_sayisi: int
    aciliyet: str
    lokasyon: str
    orijinal_metin: str

@router.post("/analyze", response_model=SOSAnalyzeResponse)
async def analyze_sos(
    audio_file: UploadFile = File(...),
    user_id: str = Form(...),
    timestamp: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...)
) -> SOSAnalyzeResponse:
    """
    Accept voice recording and queue for async processing.
    Returns immediately with task_id.
    """
    pass

@router.get("/status/{task_id}", response_model=SOSStatusResponse)
async def get_sos_status(task_id: str) -> SOSStatusResponse:
    """
    Check processing status of an S.O.S submission.
    """
    pass

@router.get("/{sos_id}/audio")
async def get_sos_audio(sos_id: str):
    """
    Retrieve audio file for an S.O.S record.
    Returns signed URL or streams audio.
    """
    pass
```

#### Database Models (SQLAlchemy)

```python
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

class SOSRecord(Base):
    __tablename__ = "sos_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    
    # Extracted structured data
    durum = Column(String, nullable=False)  # "Enkaz Altında", "Güvende", "Bilinmiyor"
    kisi_sayisi = Column(Integer, nullable=False, default=1)
    aciliyet = Column(String, nullable=False)  # "Kırmızı", "Sarı", "Yeşil"
    lokasyon = Column(Text, nullable=False)
    orijinal_metin = Column(Text, nullable=True)
    
    # Audio storage
    audio_url = Column(String, nullable=False)
    audio_filename = Column(String, nullable=False)
    
    # Metadata
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    processing_status = Column(String, default="pending")  # pending, completed, failed
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_user_created', 'user_id', 'created_at'),
        Index('idx_aciliyet', 'aciliyet'),
    )
```

#### Celery Task (Async Processing)

```python
from celery import Task
from app.services.whisper_service import WhisperService
from app.services.llm_extractor import LLMExtractor
from app.services.audio_storage import AudioStorage
from app.services.emergency_alert import EmergencyAlertService

@celery_app.task(bind=True, max_retries=0)
def process_sos_audio(
    self: Task,
    audio_path: str,
    user_id: str,
    timestamp: str,
    latitude: float,
    longitude: float
) -> dict:
    """
    Process S.O.S audio recording:
    1. Save audio to storage
    2. Transcribe with Whisper
    3. Extract structured data with LLM
    4. Save to database
    5. Send emergency alerts
    
    Returns extracted data or raises exception.
    """
    try:
        # Initialize services
        whisper = WhisperService()
        llm = LLMExtractor()
        storage = AudioStorage()
        alert_service = EmergencyAlertService()
        
        # Save audio file
        audio_url = storage.save_audio(audio_path, user_id, timestamp)
        
        # Transcribe audio
        transcription = whisper.transcribe(audio_path, language="tr", timeout=10)
        
        # Extract structured data
        extracted = llm.extract_sos_data(transcription, timeout=15)
        
        # Use GPS if no location mentioned
        if not extracted.get("lokasyon"):
            extracted["lokasyon"] = f"GPS: {latitude}, {longitude}"
        
        # Save to database
        sos_record = create_sos_record(
            user_id=user_id,
            durum=extracted["durum"],
            kisi_sayisi=extracted["kisi_sayisi"],
            aciliyet=extracted["aciliyet"],
            lokasyon=extracted["lokasyon"],
            orijinal_metin=transcription,
            audio_url=audio_url,
            latitude=latitude,
            longitude=longitude,
            processing_status="completed"
        )
        
        # Send emergency alerts
        alert_service.send_sos_alert(user_id, sos_record)
        
        return {
            "sos_id": str(sos_record.id),
            "durum": sos_record.durum,
            "kisi_sayisi": sos_record.kisi_sayisi,
            "aciliyet": sos_record.aciliyet,
            "lokasyon": sos_record.lokasyon,
            "orijinal_metin": sos_record.orijinal_metin
        }
        
    except WhisperServiceError as e:
        # Fallback: Send raw audio
        return handle_whisper_failure(audio_url, user_id, latitude, longitude)
        
    except LLMExtractorError as e:
        # Fallback: Send transcription without extraction
        return handle_llm_failure(transcription, audio_url, user_id, latitude, longitude)
        
    except Exception as e:
        # Critical failure: Still send something
        return handle_critical_failure(audio_url, user_id, latitude, longitude, str(e))
```

#### WhisperService

```python
import httpx
from typing import Optional

class WhisperServiceError(Exception):
    pass

class WhisperService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.api_url = "https://api.openai.com/v1/audio/transcriptions"
        self.timeout = 10  # seconds
    
    async def transcribe(
        self,
        audio_path: str,
        language: str = "tr",
        timeout: Optional[int] = None
    ) -> str:
        """
        Transcribe audio file to text using Whisper API.
        
        Args:
            audio_path: Path to audio file
            language: Language code (default: "tr" for Turkish)
            timeout: Request timeout in seconds
            
        Returns:
            Transcribed text
            
        Raises:
            WhisperServiceError: If transcription fails
        """
        timeout = timeout or self.timeout
        
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                with open(audio_path, "rb") as audio_file:
                    response = await client.post(
                        self.api_url,
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        files={"file": audio_file},
                        data={
                            "model": "whisper-1",
                            "language": language,
                            "response_format": "text"
                        }
                    )
                    
                if response.status_code != 200:
                    raise WhisperServiceError(f"Whisper API error: {response.text}")
                    
                return response.text.strip()
                
        except httpx.TimeoutException:
            raise WhisperServiceError("Whisper API timeout")
        except Exception as e:
            raise WhisperServiceError(f"Whisper transcription failed: {str(e)}")
```

#### LLMExtractor

```python
import anthropic
from typing import Dict, Optional
import json

class LLMExtractorError(Exception):
    pass

class LLMExtractor:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.timeout = 15  # seconds
        
    async def extract_sos_data(
        self,
        transcription: str,
        timeout: Optional[int] = None
    ) -> Dict[str, any]:
        """
        Extract structured S.O.S data from transcribed text using Claude.
        
        Args:
            transcription: Transcribed text from Whisper
            timeout: Request timeout in seconds
            
        Returns:
            Dictionary with keys: durum, kisi_sayisi, aciliyet, lokasyon
            
        Raises:
            LLMExtractorError: If extraction fails
        """
        timeout = timeout or self.timeout
        
        prompt = f"""Sen bir acil durum analiz asistanısın. Aşağıdaki deprem sırasında kaydedilmiş ses metninden yapılandırılmış veri çıkar.

Metin: "{transcription}"

Lütfen şu bilgileri çıkar ve JSON formatında döndür:
- durum: "Enkaz Altında" veya "Güvende" (kişi enkaz altında mı yoksa güvende mi?)
- kisi_sayisi: Kaç kişi olduğu (sayı olarak, belirtilmemişse 1)
- aciliyet: "Kırmızı" (acil yardım gerekli), "Sarı" (yardım gerekebilir), veya "Yeşil" (güvende)
- lokasyon: Söylenen adres veya yer bilgisi (belirtilmemişse boş string)

Sadece JSON döndür, başka açıklama ekleme.

Örnek:
{{
  "durum": "Enkaz Altında",
  "kisi_sayisi": 2,
  "aciliyet": "Kırmızı",
  "lokasyon": "Atatürk Mahallesi, Bina 15, Daire 3"
}}"""

        try:
            message = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=500,
                temperature=0,
                timeout=timeout,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_text = message.content[0].text.strip()
            
            # Parse JSON response
            extracted = json.loads(response_text)
            
            # Validate and set defaults
            result = {
                "durum": extracted.get("durum", "Bilinmiyor"),
                "kisi_sayisi": int(extracted.get("kisi_sayisi", 1)),
                "aciliyet": extracted.get("aciliyet", "Sarı"),
                "lokasyon": extracted.get("lokasyon", "")
            }
            
            # Validate values
            if result["durum"] not in ["Enkaz Altında", "Güvende", "Bilinmiyor"]:
                result["durum"] = "Bilinmiyor"
            if result["aciliyet"] not in ["Kırmızı", "Sarı", "Yeşil"]:
                result["aciliyet"] = "Sarı"
            if result["kisi_sayisi"] < 1:
                result["kisi_sayisi"] = 1
                
            return result
            
        except anthropic.APITimeoutError:
            raise LLMExtractorError("Claude API timeout")
        except json.JSONDecodeError:
            raise LLMExtractorError("Failed to parse Claude response as JSON")
        except Exception as e:
            raise LLMExtractorError(f"LLM extraction failed: {str(e)}")
```

#### FallbackHandler

```python
class FallbackHandler:
    """
    Handles failures in AI services by sending raw data to emergency contacts.
    """
    
    def __init__(self):
        self.alert_service = EmergencyAlertService()
    
    async def handle_whisper_failure(
        self,
        audio_url: str,
        user_id: str,
        latitude: float,
        longitude: float
    ) -> Dict[str, any]:
        """
        Fallback when Whisper fails: Send raw audio URL.
        """
        logger.warning(f"Whisper failure for user {user_id}, using fallback")
        
        # Create SOS record with minimal data
        sos_record = create_sos_record(
            user_id=user_id,
            durum="Bilinmiyor",
            kisi_sayisi=1,
            aciliyet="Kırmızı",  # Assume worst case
            lokasyon=f"GPS: {latitude}, {longitude}",
            orijinal_metin="[Ses metni işlenemedi]",
            audio_url=audio_url,
            latitude=latitude,
            longitude=longitude,
            processing_status="completed",
            error_message="Whisper transcription failed"
        )
        
        # Send fallback alert
        message = f"S.O.S Bildirimi (İşlenmemiş): Ses kaydı: {audio_url}. Konum: GPS {latitude}, {longitude}"
        await self.alert_service.send_fallback_alert(user_id, message, audio_url)
        
        return {
            "sos_id": str(sos_record.id),
            "durum": "Bilinmiyor",
            "kisi_sayisi": 1,
            "aciliyet": "Kırmızı",
            "lokasyon": sos_record.lokasyon,
            "orijinal_metin": "[Ses metni işlenemedi]"
        }
    
    async def handle_llm_failure(
        self,
        transcription: str,
        audio_url: str,
        user_id: str,
        latitude: float,
        longitude: float
    ) -> Dict[str, any]:
        """
        Fallback when LLM fails: Send transcription without extraction.
        """
        logger.warning(f"LLM failure for user {user_id}, using fallback")
        
        # Create SOS record with transcription but no extraction
        sos_record = create_sos_record(
            user_id=user_id,
            durum="Bilinmiyor",
            kisi_sayisi=1,
            aciliyet="Kırmızı",  # Assume worst case
            lokasyon=f"GPS: {latitude}, {longitude}",
            orijinal_metin=transcription,
            audio_url=audio_url,
            latitude=latitude,
            longitude=longitude,
            processing_status="completed",
            error_message="LLM extraction failed"
        )
        
        # Send fallback alert with transcription
        message = f"S.O.S Bildirimi: {transcription}. Konum: GPS {latitude}, {longitude}. Ses: {audio_url}"
        await self.alert_service.send_fallback_alert(user_id, message, audio_url)
        
        return {
            "sos_id": str(sos_record.id),
            "durum": "Bilinmiyor",
            "kisi_sayisi": 1,
            "aciliyet": "Kırmızı",
            "lokasyon": sos_record.lokasyon,
            "orijinal_metin": transcription
        }
```

#### AudioStorage

```python
import os
from datetime import datetime, timedelta
from pathlib import Path

class AudioStorage:
    """
    Handles audio file storage and retrieval.
    """
    
    def __init__(self):
        self.base_path = Path(settings.SOS_AUDIO_STORAGE_PATH)
        self.base_url = settings.SOS_AUDIO_BASE_URL
    
    def save_audio(self, audio_path: str, user_id: str, timestamp: str) -> str:
        """
        Save audio file to storage with organized directory structure.
        
        Returns:
            URL to access the audio file
        """
        # Parse timestamp
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        # Create directory structure: /sos_audio/2024/01/15/
        dir_path = self.base_path / str(dt.year) / f"{dt.month:02d}" / f"{dt.day:02d}"
        dir_path.mkdir(parents=True, exist_ok=True)
        
        # Generate filename: sos_user123_20240115_143022.m4a
        ext = Path(audio_path).suffix
        filename = f"sos_{user_id}_{dt.strftime('%Y%m%d_%H%M%S')}{ext}"
        
        # Copy file to storage
        dest_path = dir_path / filename
        shutil.copy(audio_path, dest_path)
        
        # Generate URL
        relative_path = f"{dt.year}/{dt.month:02d}/{dt.day:02d}/{filename}"
        audio_url = f"{self.base_url}/{relative_path}"
        
        return audio_url
    
    def generate_signed_url(self, audio_url: str, expiration_hours: int = 24) -> str:
        """
        Generate signed URL with expiration for secure access.
        """
        # Implementation depends on storage backend (S3, local, etc.)
        # For local storage, could use JWT token
        pass
```

## Data Models

### SOS Record JSON Structure

```json
{
  "sos_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_12345",
  "durum": "Enkaz Altında",
  "kisi_sayisi": 3,
  "aciliyet": "Kırmızı",
  "lokasyon": "Atatürk Mahallesi, Bina 15, Daire 3, Antakya",
  "orijinal_metin": "Yardım edin! Enkaz altındayız. Üç kişiyiz. Atatürk Mahallesi, on beş numaralı bina, üçüncü kat.",
  "audio_url": "https://api.depremapp.com/sos_audio/2024/01/15/sos_user12345_20240115_143022.m4a",
  "latitude": 36.2048,
  "longitude": 36.1615,
  "processing_status": "completed",
  "created_at": "2024-01-15T14:30:22Z",
  "updated_at": "2024-01-15T14:30:35Z"
}
```

### Emergency Alert Message Format

```
S.O.S Bildirimi: Enkaz Altında. 3 kişi. Aciliyet: Kırmızı. 
Konum: Atatürk Mahallesi, Bina 15, Daire 3, Antakya
Ses Kaydı: https://api.depremapp.com/sos_audio/...
Zaman: 15.01.2024 14:30
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following areas where properties can be consolidated:

1. **Audio Format and Encoding**: Properties 1.9, 2.2, 2.3 all relate to audio upload requirements - can be combined into a single comprehensive property about valid audio uploads
2. **Field Validation**: Properties 4.2, 4.3, 4.4 all test that extracted fields have valid values - can be combined into one property about extraction output validity
3. **Database Record Completeness**: Properties 5.2, 5.4, 5.5 all test that SOS_Record has required fields - can be combined into one property about record completeness
4. **Notification Message Format**: Properties 6.2, 6.4, 6.6 all test notification message content - can be combined into one property about notification completeness
5. **Logging Requirements**: Properties 3.7, 7.6, 11.6, 12.6 all test that events are logged - can be combined into one property about audit logging

After consolidation, we have the following unique properties:

### Core Processing Properties
- Audio upload validation (format, endpoint, required fields)
- Whisper transcription invocation and language configuration
- LLM extraction invocation and output validation
- Database record creation and completeness
- Emergency contact notification with complete information

### Fallback Properties
- Whisper failure triggers fallback with audio URL
- LLM failure triggers fallback with transcription
- Fallback creates records with safe defaults

### API Properties
- Async processing returns 202 with task_id
- Status endpoint returns complete status information
- Invalid input returns 400 with error message

### Storage Properties
- Audio files stored with correct naming and directory structure
- Signed URLs generated for audio access
- Audio retrieval requires authorization

### Audit Properties
- All significant events are logged (transcription, fallback, rate limits, audio access)

### Correctness Properties

Property 1: Valid Audio Upload Format
*For any* audio recording uploaded by the mobile app, the audio file SHALL be in a format compatible with Whisper API (MP3, WAV, or M4A), sent to the /api/v1/sos/analyze endpoint, and include all required fields (user_id, timestamp, latitude, longitude)
**Validates: Requirements 1.9, 2.2, 2.3**

Property 2: Whisper Service Invocation
*For any* voice recording received by the backend, the SOS_Analyzer SHALL send the audio to Whisper_Service configured for Turkish language transcription, and store the returned text in the orijinal_metin field
**Validates: Requirements 3.1, 3.2, 3.3**

Property 3: LLM Extraction Invocation and Validation
*For any* transcribed text, the SOS_Analyzer SHALL send it to LLM_Extractor, and the extracted data SHALL contain durum (one of: "Enkaz Altında", "Güvende", "Bilinmiyor"), kisi_sayisi (positive integer), aciliyet (one of: "Kırmızı", "Sarı", "Yeşil"), lokasyon (non-empty string), and orijinal_metin (preserved original text)
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

Property 4: SOS Record Completeness
*For any* successfully processed S.O.S submission, the created SOS_Record SHALL include all required fields (id, user_id, durum, kisi_sayisi, aciliyet, lokasyon, orijinal_metin, audio_url, created_at, updated_at) with the user_id matching the submitter and audio_url pointing to the stored audio file
**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

Property 5: Emergency Contact Notification Completeness
*For any* created SOS_Record, the Backend_System SHALL retrieve emergency contacts, format a notification message containing durum, kisi_sayisi, aciliyet, lokasyon, timestamp, and audio URL, and send it through the Emergency_Contact_System
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.6**

Property 6: Fallback Message Format
*For any* fallback activation (Whisper or LLM failure), the Fallback_Handler SHALL format the message to include "S.O.S Bildirimi (İşlenmemiş)", audio URL, GPS coordinates, and timestamp
**Validates: Requirements 7.4**

Property 7: Async Processing Response
*For any* request to /api/v1/sos/analyze, the Backend_System SHALL immediately return a 202 Accepted response with a task_id and create a Celery task for asynchronous processing
**Validates: Requirements 9.1, 9.2**

Property 8: Status Endpoint Completeness
*For any* task_id query to /api/v1/sos/status/{task_id}, the response SHALL include status field (pending/processing/completed/failed), and when completed SHALL include extracted_data, or when failed SHALL include error_message
**Validates: Requirements 9.7**

Property 9: Input Validation Error Response
*For any* invalid request to /api/v1/sos/analyze (missing audio_file or invalid format), the Backend_System SHALL return a 400 error with a descriptive error message
**Validates: Requirements 8.3, 8.4**

Property 10: Successful Response Completeness
*For any* successfully completed S.O.S processing, the response SHALL include all required fields: durum, kisi_sayisi, aciliyet, lokasyon, orijinal_metin, and sos_id
**Validates: Requirements 8.6**

Property 11: Audio Storage Naming and Structure
*For any* received audio file, the Backend_System SHALL store it with filename format sos_{user_id}_{timestamp}.{extension} in directory structure /sos_audio/{year}/{month}/{day}/, and generate a signed URL with 24-hour expiration
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

Property 12: Audio Retrieval Authorization
*For any* request to retrieve audio via /api/v1/sos/{sos_id}/audio, the Backend_System SHALL verify the requester has permission to access the recording before serving the file
**Validates: Requirements 10.7**

Property 13: Comprehensive Audit Logging
*For any* significant event (transcription attempt, fallback activation, rate limit violation, audio file access), the Backend_System SHALL create a log entry with event type, user_id, timestamp, and relevant details
**Validates: Requirements 3.7, 7.6, 11.6, 12.6**

Property 14: Push Notification on Completion
*For any* completed Celery task, the Backend_System SHALL send a push notification to the Mobile_App containing the extracted data
**Validates: Requirements 9.5**

## Error Handling

### Error Categories and Responses

1. **Client Errors (4xx)**
   - 400 Bad Request: Invalid audio format, missing required fields
   - 401 Unauthorized: Invalid or missing authentication token
   - 403 Forbidden: Attempting to access another user's S.O.S records
   - 429 Too Many Requests: Rate limit exceeded (10 submissions per hour)

2. **Server Errors (5xx)**
   - 500 Internal Server Error: Unexpected processing failure (fallback still triggered)
   - 503 Service Unavailable: Backend overloaded or maintenance mode
   - 504 Gateway Timeout: Processing exceeded 30-second timeout

### Fallback Mechanisms

**Level 1: Whisper Failure**
- Retry once after 1 second
- If retry fails: Send raw audio URL to emergency contacts
- Create SOS_Record with durum="Bilinmiyor", aciliyet="Kırmızı"
- Log error details

**Level 2: LLM Failure**
- Retry once after 1 second
- If retry fails: Send transcribed text without extraction
- Create SOS_Record with default values and transcription
- Log error details

**Level 3: Critical Failure**
- If both Whisper and LLM fail: Send audio URL + GPS coordinates
- Always create SOS_Record (even with minimal data)
- Always notify emergency contacts (even with raw data)
- Never fail silently - user's safety is priority

### Timeout Strategy

| Service | Timeout | Retry | Total Max Time |
|---------|---------|-------|----------------|
| Whisper API | 10s | 1x (1s delay) | ~21s |
| LLM API | 15s | 1x (1s delay) | ~31s |
| Total Processing | 30s | 0x | 30s |
| Audio Upload | 3s | 2x | 9s |

### Error Logging

All errors logged with:
- Timestamp (ISO 8601)
- User ID
- Error type and message
- Stack trace (for 5xx errors)
- Request context (audio size, duration, etc.)

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and error conditions
- Specific audio format validation (MP3, WAV, M4A)
- Retry logic with simulated failures
- Fallback activation scenarios
- Rate limiting edge cases
- Permission denial handling
- Timeout scenarios

**Property-Based Tests**: Verify universal properties across all inputs
- Audio upload validation across random valid/invalid formats
- Extraction output validation across random transcriptions
- Database record completeness across random inputs
- Notification message format across random SOS data
- Audit logging across random events

### Property-Based Testing Configuration

**Library**: Use `hypothesis` for Python backend tests, `fast-check` for TypeScript mobile tests

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: nlp-sos-voice-alert, Property {number}: {property_text}`
- Generators for: audio files, transcriptions, extracted data, user IDs, coordinates

**Example Property Test Structure**:

```python
from hypothesis import given, strategies as st
import pytest

@given(
    user_id=st.text(min_size=1, max_size=50),
    audio_format=st.sampled_from(['mp3', 'wav', 'm4a']),
    latitude=st.floats(min_value=-90, max_value=90),
    longitude=st.floats(min_value=-180, max_value=180)
)
@pytest.mark.property_test
def test_property_1_valid_audio_upload_format(user_id, audio_format, latitude, longitude):
    """
    Feature: nlp-sos-voice-alert, Property 1: Valid Audio Upload Format
    
    For any audio recording uploaded by the mobile app, the audio file SHALL be 
    in a format compatible with Whisper API (MP3, WAV, or M4A), sent to the 
    /api/v1/sos/analyze endpoint, and include all required fields.
    """
    # Test implementation
    pass
```

### Integration Testing

**Critical Integration Points**:
1. Mobile App → Backend API (multipart upload)
2. Backend → Whisper API (audio transcription)
3. Backend → LLM API (data extraction)
4. Backend → Emergency Contact System (notification delivery)
5. Backend → PostgreSQL (data persistence)
6. Backend → Redis (rate limiting, Celery queue)

**Integration Test Scenarios**:
- End-to-end: Record audio → Upload → Process → Notify → Verify delivery
- Fallback: Simulate Whisper failure → Verify fallback notification sent
- Rate limiting: Submit 11 requests → Verify 11th is rejected
- Authorization: Attempt to access another user's audio → Verify 403 error

### Performance Testing

**Load Testing Targets**:
- 100 concurrent S.O.S submissions
- 1000 status endpoint queries per second
- Audio file uploads up to 5MB
- Processing completion within 30 seconds for 95th percentile

**Stress Testing**:
- Whisper API timeout simulation
- LLM API timeout simulation
- Database connection pool exhaustion
- Redis connection failures

### Security Testing

**Test Cases**:
- SQL injection attempts in user_id field
- Path traversal attempts in audio file retrieval
- Unauthorized audio access attempts
- Rate limit bypass attempts
- Audio file size bomb (extremely large files)

## Deployment Considerations

### Environment Variables

```env
# Whisper API
OPENAI_API_KEY=sk-...
WHISPER_API_URL=https://api.openai.com/v1/audio/transcriptions
WHISPER_TIMEOUT=10

# LLM API
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-3-haiku-20240307
LLM_TIMEOUT=15

# Audio Storage
SOS_AUDIO_STORAGE_PATH=/var/app/sos_audio
SOS_AUDIO_BASE_URL=https://api.depremapp.com/sos_audio
AUDIO_MAX_SIZE_MB=5

# Rate Limiting
SOS_RATE_LIMIT_PER_HOUR=10
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/deprem_db

# Emergency Contacts
EMERGENCY_CONTACT_API_URL=http://localhost:8000/api/v1/emergency
```

### Database Migrations

```python
# Alembic migration for SOS_Record table
def upgrade():
    op.create_table(
        'sos_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('durum', sa.String(), nullable=False),
        sa.Column('kisi_sayisi', sa.Integer(), nullable=False),
        sa.Column('aciliyet', sa.String(), nullable=False),
        sa.Column('lokasyon', sa.Text(), nullable=False),
        sa.Column('orijinal_metin', sa.Text(), nullable=True),
        sa.Column('audio_url', sa.String(), nullable=False),
        sa.Column('audio_filename', sa.String(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('processing_status', sa.String(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_user_created', 'sos_records', ['user_id', 'created_at'])
    op.create_index('idx_aciliyet', 'sos_records', ['aciliyet'])
```

### Monitoring and Alerts

**Metrics to Track**:
- S.O.S submission rate (per minute)
- Whisper API success rate and latency
- LLM API success rate and latency
- Fallback activation rate
- Average processing time
- Rate limit hit rate
- Audio storage usage

**Alerts**:
- Whisper API failure rate > 10%
- LLM API failure rate > 10%
- Average processing time > 25 seconds
- Fallback activation rate > 5%
- Audio storage > 80% capacity

### Scalability Considerations

**Horizontal Scaling**:
- Multiple Celery workers for parallel processing
- Load balancer for API endpoints
- Separate audio storage service (S3 or similar)

**Vertical Scaling**:
- Increase Celery worker memory for large audio files
- Increase database connection pool size
- Increase Redis memory for rate limiting

**Cost Optimization**:
- Use Whisper API batch processing if available
- Cache LLM extraction patterns for common phrases
- Compress audio files before storage
- Implement audio file cleanup (30-day retention)
