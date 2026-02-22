# Requirements Document

## Introduction

The NLP-Powered Smart S.O.S feature enables users to report their emergency status during an earthquake using voice commands instead of typing. The system uses speech-to-text conversion and natural language processing to extract structured emergency information from voice recordings, then automatically alerts emergency contacts with the extracted status information. This feature is critical for crisis situations where users cannot type or look at their screens.

## Glossary

- **Voice_Recorder**: Mobile app component that captures audio from the user's microphone
- **SOS_Analyzer**: Backend service that processes voice recordings and extracts structured emergency data
- **Whisper_Service**: Speech-to-text API service (OpenAI Whisper or similar) that converts audio to text
- **LLM_Extractor**: Large Language Model service (Claude/OpenAI) that extracts structured data from transcribed text
- **SOS_Record**: Database entity storing voice-based emergency reports with extracted structured data
- **Emergency_Contact_System**: Existing alert system that sends notifications to user's emergency contacts
- **Durum**: Turkish term for "status" - indicates if user is trapped under rubble or safe
- **Aciliyet**: Turkish term for "urgency" - color-coded priority level (Red/Yellow/Green)
- **Fallback_Handler**: Error handling mechanism that sends raw audio/text when AI services fail
- **Mobile_App**: React Native (Expo) earthquake detection application
- **Backend_System**: Python FastAPI server with PostgreSQL, Redis, and Celery

## Requirements

### Requirement 1: Voice Recording Interface

**User Story:** As a user experiencing an earthquake, I want to press a button to record my voice, so that I can report my status without typing or looking at the screen.

#### Acceptance Criteria

1. THE Mobile_App SHALL display a prominent voice recording button on the emergency screen
2. WHEN the user presses the voice recording button, THE Voice_Recorder SHALL begin capturing audio
3. WHEN the user holds the voice recording button, THE Voice_Recorder SHALL continue recording until the button is released
4. WHEN the user releases the voice recording button, THE Voice_Recorder SHALL stop recording and send the audio to the Backend_System
5. THE Voice_Recorder SHALL support recordings between 1 second and 60 seconds in duration
6. WHEN recording duration exceeds 60 seconds, THE Voice_Recorder SHALL automatically stop and send the audio
7. THE Voice_Recorder SHALL provide visual feedback during recording (animation, timer, waveform)
8. WHEN the user attempts to record without microphone permission, THE Mobile_App SHALL request permission and display an error if denied
9. THE Voice_Recorder SHALL encode audio in a format compatible with Whisper API (MP3, WAV, or M4A)

### Requirement 2: Voice Data Transmission

**User Story:** As a user, I want my voice recording sent quickly to the backend, so that emergency responders receive my status information as fast as possible during a crisis.

#### Acceptance Criteria

1. WHEN a voice recording is completed, THE Mobile_App SHALL send the audio file to the Backend_System within 2 seconds
2. THE Mobile_App SHALL send audio to the POST endpoint /api/v1/sos/analyze
3. WHEN sending audio, THE Mobile_App SHALL include user_id, timestamp, and GPS coordinates in the request
4. WHEN network connectivity is poor, THE Mobile_App SHALL compress audio to reduce file size while maintaining clarity
5. WHEN the upload fails, THE Mobile_App SHALL retry up to 2 times with 3-second timeout per attempt
6. WHEN all upload attempts fail, THE Mobile_App SHALL notify the user and store the recording locally for later retry
7. THE Mobile_App SHALL display upload progress to the user

### Requirement 3: Speech-to-Text Conversion

**User Story:** As a developer, I want voice recordings converted to text, so that the system can analyze the content and extract emergency information.

#### Acceptance Criteria

1. WHEN the Backend_System receives a voice recording, THE SOS_Analyzer SHALL send the audio to the Whisper_Service
2. THE SOS_Analyzer SHALL configure Whisper_Service to transcribe in Turkish language
3. WHEN Whisper_Service returns transcribed text, THE SOS_Analyzer SHALL store the original text in the orijinal_metin field
4. WHEN Whisper_Service fails to transcribe, THE SOS_Analyzer SHALL retry once after 1 second
5. WHEN Whisper_Service fails after retry, THE SOS_Analyzer SHALL invoke the Fallback_Handler
6. THE SOS_Analyzer SHALL set a timeout of 10 seconds for Whisper_Service requests
7. THE SOS_Analyzer SHALL log all transcription attempts with success/failure status

### Requirement 4: NLP-Based Data Extraction

**User Story:** As a developer, I want structured emergency data extracted from transcribed text, so that emergency contacts receive clear, actionable information.

#### Acceptance Criteria

1. WHEN transcribed text is available, THE SOS_Analyzer SHALL send the text to the LLM_Extractor
2. THE LLM_Extractor SHALL extract durum field with values "Enkaz Altında" or "Güvende"
3. THE LLM_Extractor SHALL extract kisi_sayisi field as an integer representing number of people
4. THE LLM_Extractor SHALL extract aciliyet field with values "Kırmızı", "Sarı", or "Yeşil"
5. THE LLM_Extractor SHALL extract lokasyon field from spoken address or use GPS coordinates if no address mentioned
6. THE LLM_Extractor SHALL preserve the orijinal_metin field with the full transcribed text
7. WHEN the LLM_Extractor cannot determine a field value, THE LLM_Extractor SHALL use default values: durum="Bilinmiyor", kisi_sayisi=1, aciliyet="Sarı"
8. THE SOS_Analyzer SHALL set a timeout of 15 seconds for LLM_Extractor requests
9. WHEN LLM_Extractor fails, THE SOS_Analyzer SHALL invoke the Fallback_Handler

### Requirement 5: Structured Data Storage

**User Story:** As a system administrator, I want S.O.S calls stored in the database, so that emergency responders can review historical reports and track user status over time.

#### Acceptance Criteria

1. THE Backend_System SHALL define an SOS_Record model using SQLAlchemy
2. THE SOS_Record SHALL include fields: id, user_id, durum, kisi_sayisi, aciliyet, lokasyon, orijinal_metin, audio_url, created_at, updated_at
3. WHEN structured data is extracted, THE Backend_System SHALL create an SOS_Record in PostgreSQL
4. THE Backend_System SHALL store the audio file URL in the audio_url field
5. THE Backend_System SHALL associate each SOS_Record with the user_id who created it
6. THE Backend_System SHALL index SOS_Record by user_id and created_at for efficient querying
7. THE Backend_System SHALL store GPS coordinates in the lokasyon field when no spoken address is provided

### Requirement 6: Emergency Contact Notification

**User Story:** As a user, I want my emergency contacts notified with my voice-reported status, so that they receive accurate information about my situation during an earthquake.

#### Acceptance Criteria

1. WHEN an SOS_Record is created, THE Backend_System SHALL retrieve the user's emergency contacts from the Emergency_Contact_System
2. WHEN emergency contacts are retrieved, THE Backend_System SHALL format a notification message including durum, kisi_sayisi, aciliyet, and lokasyon
3. THE Backend_System SHALL send notifications through the existing Emergency_Contact_System
4. THE notification message SHALL be formatted as: "S.O.S Bildirimi: [Durum]. [Kişi Sayısı] kişi. Aciliyet: [Aciliyet]. Konum: [Lokasyon]. Zaman: [Timestamp]"
5. WHEN aciliyet is "Kırmızı", THE Backend_System SHALL prioritize the notification for immediate delivery
6. THE Backend_System SHALL include a link to the original audio recording in the notification
7. WHEN no emergency contacts exist, THE Backend_System SHALL log a warning and return success to the mobile app

### Requirement 7: Fallback Error Handling

**User Story:** As a user, I want my emergency message sent even if AI services fail, so that my contacts are notified regardless of technical issues during a crisis.

#### Acceptance Criteria

1. WHEN Whisper_Service fails after retry, THE Fallback_Handler SHALL send the raw audio file URL to emergency contacts
2. WHEN LLM_Extractor fails after retry, THE Fallback_Handler SHALL send the transcribed text without structured extraction to emergency contacts
3. THE Fallback_Handler SHALL create an SOS_Record with durum="Bilinmiyor", aciliyet="Kırmızı" (assume worst case)
4. THE Fallback_Handler SHALL format fallback messages as: "S.O.S Bildirimi (İşlenmemiş): Ses kaydı: [Audio URL]. Zaman: [Timestamp]"
5. WHEN both Whisper_Service and LLM_Extractor fail, THE Fallback_Handler SHALL send only the audio URL and GPS coordinates
6. THE Backend_System SHALL log all fallback activations with error details
7. THE Fallback_Handler SHALL complete within 5 seconds to ensure timely notification

### Requirement 8: API Endpoint Specification

**User Story:** As a mobile developer, I want a well-defined API endpoint for S.O.S analysis, so that I can integrate voice reporting into the mobile app reliably.

#### Acceptance Criteria

1. THE Backend_System SHALL provide a POST endpoint at /api/v1/sos/analyze
2. THE endpoint SHALL accept multipart/form-data with fields: audio_file, user_id, timestamp, latitude, longitude
3. WHEN the endpoint receives a request, THE Backend_System SHALL validate that audio_file is present and is a valid audio format
4. WHEN the endpoint receives invalid data, THE Backend_System SHALL return a 400 error with descriptive error message
5. WHEN processing succeeds, THE endpoint SHALL return a 200 response with the extracted JSON structure
6. THE response JSON SHALL include: durum, kisi_sayisi, aciliyet, lokasyon, orijinal_metin, sos_id
7. WHEN processing fails, THE endpoint SHALL return a 500 error but still trigger fallback notifications
8. THE endpoint SHALL complete processing within 30 seconds or timeout

### Requirement 9: Asynchronous Processing with Celery

**User Story:** As a developer, I want S.O.S processing handled asynchronously, so that the mobile app receives a quick response and doesn't wait for AI service calls.

#### Acceptance Criteria

1. WHEN the /api/v1/sos/analyze endpoint receives a request, THE Backend_System SHALL immediately return a 202 Accepted response with a task_id
2. THE Backend_System SHALL create a Celery task to process the audio asynchronously
3. THE Celery task SHALL perform speech-to-text conversion, NLP extraction, database storage, and notification sending
4. THE Mobile_App SHALL receive the task_id and display a "Processing your S.O.S..." message
5. WHEN processing completes, THE Backend_System SHALL send a push notification to the Mobile_App with the extracted data
6. THE Backend_System SHALL provide a GET endpoint at /api/v1/sos/status/{task_id} to check processing status
7. THE status endpoint SHALL return: status (pending/processing/completed/failed), extracted_data (when completed), error_message (when failed)

### Requirement 10: Audio Storage and Retrieval

**User Story:** As an emergency responder, I want access to original audio recordings, so that I can hear the user's voice and understand context that may not be captured in structured data.

#### Acceptance Criteria

1. WHEN an audio file is received, THE Backend_System SHALL store it in a secure file storage system
2. THE Backend_System SHALL generate a unique filename using format: sos_{user_id}_{timestamp}.{extension}
3. THE Backend_System SHALL store audio files in a directory structure: /sos_audio/{year}/{month}/{day}/
4. THE Backend_System SHALL generate a signed URL for the audio file with 24-hour expiration
5. THE Backend_System SHALL include the signed audio URL in the SOS_Record
6. THE Backend_System SHALL provide a GET endpoint at /api/v1/sos/{sos_id}/audio to retrieve audio files
7. WHEN retrieving audio, THE Backend_System SHALL verify the requester has permission to access the recording

### Requirement 11: Rate Limiting and Abuse Prevention

**User Story:** As a system administrator, I want rate limiting on S.O.S submissions, so that the system is not abused or overwhelmed during high-traffic periods.

#### Acceptance Criteria

1. THE Backend_System SHALL limit each user to 10 S.O.S submissions per hour
2. WHEN a user exceeds the rate limit, THE Backend_System SHALL return a 429 error with a retry-after header
3. THE Backend_System SHALL use Redis to track submission counts per user
4. THE rate limit SHALL reset every hour
5. WHEN a user is rate-limited, THE Mobile_App SHALL display a message: "S.O.S limiti aşıldı. Lütfen acil durumlarda kullanın."
6. THE Backend_System SHALL log rate limit violations for monitoring

### Requirement 12: Privacy and Data Retention

**User Story:** As a user, I want my voice recordings handled securely and deleted after a reasonable period, so that my privacy is protected.

#### Acceptance Criteria

1. THE Backend_System SHALL encrypt audio files at rest using AES-256 encryption
2. THE Backend_System SHALL automatically delete audio files older than 30 days
3. THE Backend_System SHALL provide a user endpoint to delete their own S.O.S records and audio files
4. WHEN a user deletes their account, THE Backend_System SHALL delete all associated SOS_Records and audio files
5. THE Backend_System SHALL not share audio recordings with third parties except emergency contacts
6. THE Backend_System SHALL log all audio file access attempts for audit purposes
7. THE Mobile_App SHALL display a privacy notice before first voice recording explaining data usage
