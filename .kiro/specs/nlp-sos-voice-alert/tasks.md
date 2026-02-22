# Implementation Plan: NLP-Powered Smart S.O.S Voice Alert

## Overview

This implementation plan breaks down the NLP-Powered Smart S.O.S feature into discrete coding tasks. The feature consists of three main components: mobile voice recording interface (React Native), backend processing pipeline (FastAPI + Celery), and AI service integrations (Whisper + LLM). Tasks are organized to build incrementally, with early validation through testing and checkpoints.

## Tasks

- [ ] 1. Set up backend database models and migrations
  - Create SQLAlchemy model for SOS_Record with all required fields (id, user_id, durum, kisi_sayisi, aciliyet, lokasyon, orijinal_metin, audio_url, audio_filename, latitude, longitude, processing_status, error_message, created_at, updated_at)
  - Create Alembic migration script for sos_records table
  - Add database indexes for user_id, created_at, and aciliyet fields
  - Create Pydantic schemas for API request/response validation (SOSAnalyzeResponse, SOSStatusResponse, ExtractedSOSData)
  - _Requirements: 5.1, 5.2, 5.6_

- [ ]* 1.1 Write property test for SOS_Record completeness
  - **Property 4: SOS Record Completeness**
  - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

- [ ] 2. Implement audio storage service
  - [ ] 2.1 Create AudioStorage class with save_audio method
    - Implement directory structure creation: /sos_audio/{year}/{month}/{day}/
    - Implement filename generation: sos_{user_id}_{timestamp}.{extension}
    - Implement file copying to storage location
    - Implement URL generation for stored files
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 2.2 Implement signed URL generation
    - Create generate_signed_url method with 24-hour expiration
    - Use JWT tokens for local storage or S3 presigned URLs for cloud storage
    - _Requirements: 10.4, 10.5_
  
  - [ ]* 2.3 Write property test for audio storage naming and structure
    - **Property 11: Audio Storage Naming and Structure**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [ ] 3. Implement Whisper API integration
  - [ ] 3.1 Create WhisperService class
    - Implement transcribe method with async HTTP client (httpx)
    - Configure for Turkish language transcription
    - Implement 10-second timeout
    - Implement retry logic (1 retry after 1 second)
    - Add error handling with WhisperServiceError exception
    - _Requirements: 3.1, 3.2, 3.4, 3.6_
  
  - [ ]* 3.2 Write property test for Whisper service invocation
    - **Property 2: Whisper Service Invocation**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ]* 3.3 Write unit tests for Whisper error handling
    - Test timeout scenario
    - Test API error response
    - Test retry logic
    - _Requirements: 3.4, 3.5_

- [ ] 4. Implement LLM extraction service
  - [ ] 4.1 Create LLMExtractor class
    - Implement extract_sos_data method using Anthropic Claude API
    - Create Turkish language prompt for structured data extraction
    - Implement JSON parsing and validation
    - Implement 15-second timeout
    - Implement default value handling (durum="Bilinmiyor", kisi_sayisi=1, aciliyet="Sarı")
    - Add error handling with LLMExtractorError exception
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [ ]* 4.2 Write property test for LLM extraction validation
    - **Property 3: LLM Extraction Invocation and Validation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
  
  - [ ]* 4.3 Write unit tests for LLM error handling
    - Test timeout scenario
    - Test invalid JSON response
    - Test default value application
    - _Requirements: 4.7, 4.8, 4.9_

- [ ] 5. Implement fallback handler
  - [ ] 5.1 Create FallbackHandler class
    - Implement handle_whisper_failure method (sends raw audio URL)
    - Implement handle_llm_failure method (sends transcription without extraction)
    - Implement handle_critical_failure method (sends audio URL + GPS only)
    - Create SOS_Record with safe defaults (durum="Bilinmiyor", aciliyet="Kırmızı")
    - Format fallback messages according to specification
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 5.2 Write property test for fallback message format
    - **Property 6: Fallback Message Format**
    - **Validates: Requirements 7.4**
  
  - [ ]* 5.3 Write unit tests for fallback scenarios
    - Test Whisper failure fallback
    - Test LLM failure fallback
    - Test critical failure fallback
    - _Requirements: 7.1, 7.2, 7.5_

- [ ] 6. Checkpoint - Ensure all backend services pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Celery task for async processing
  - [ ] 7.1 Create process_sos_audio Celery task
    - Implement task with bind=True and max_retries=0
    - Call AudioStorage.save_audio to store audio file
    - Call WhisperService.transcribe with error handling
    - Call LLMExtractor.extract_sos_data with error handling
    - Use GPS coordinates for lokasyon if not extracted from text
    - Create SOS_Record in database with extracted data
    - Call EmergencyAlertService to send notifications
    - Implement try/except blocks for each service with fallback invocation
    - _Requirements: 3.1, 3.3, 4.1, 5.3, 6.1, 9.2, 9.3_
  
  - [ ]* 7.2 Write unit tests for Celery task workflow
    - Test successful processing path
    - Test Whisper failure triggers fallback
    - Test LLM failure triggers fallback
    - Test database record creation
    - _Requirements: 9.3_

- [ ] 8. Implement emergency contact notification integration
  - [ ] 8.1 Create EmergencyAlertService integration
    - Implement send_sos_alert method that retrieves emergency contacts
    - Format notification message: "S.O.S Bildirimi: [Durum]. [Kişi Sayısı] kişi. Aciliyet: [Aciliyet]. Konum: [Lokasyon]. Zaman: [Timestamp]"
    - Include audio URL in notification
    - Implement priority handling for aciliyet="Kırmızı"
    - Handle case when no emergency contacts exist (log warning, return success)
    - Call existing Emergency_Contact_System API
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 8.2 Write property test for notification completeness
    - **Property 5: Emergency Contact Notification Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.6**
  
  - [ ]* 8.3 Write unit tests for notification edge cases
    - Test red alert priority handling
    - Test no emergency contacts scenario
    - _Requirements: 6.5, 6.7_

- [ ] 9. Implement API endpoints
  - [ ] 9.1 Create POST /api/v1/sos/analyze endpoint
    - Accept multipart/form-data with audio_file, user_id, timestamp, latitude, longitude
    - Validate audio_file is present and valid format (MP3, WAV, M4A)
    - Return 400 error for invalid data with descriptive message
    - Save uploaded audio to temporary location
    - Queue Celery task with process_sos_audio
    - Return 202 Accepted with task_id immediately
    - _Requirements: 2.2, 8.1, 8.2, 8.3, 8.4, 9.1_
  
  - [ ] 9.2 Create GET /api/v1/sos/status/{task_id} endpoint
    - Query Celery task status by task_id
    - Return status (pending/processing/completed/failed)
    - Include extracted_data when status is completed
    - Include error_message when status is failed
    - _Requirements: 9.6, 9.7_
  
  - [ ] 9.3 Create GET /api/v1/sos/{sos_id}/audio endpoint
    - Retrieve SOS_Record by sos_id
    - Verify requester has permission to access recording
    - Return 403 if unauthorized
    - Generate signed URL or stream audio file
    - _Requirements: 10.6, 10.7_
  
  - [ ]* 9.4 Write property test for async processing response
    - **Property 7: Async Processing Response**
    - **Validates: Requirements 9.1, 9.2**
  
  - [ ]* 9.5 Write property test for status endpoint completeness
    - **Property 8: Status Endpoint Completeness**
    - **Validates: Requirements 9.7**
  
  - [ ]* 9.6 Write property test for input validation
    - **Property 9: Input Validation Error Response**
    - **Validates: Requirements 8.3, 8.4**
  
  - [ ]* 9.7 Write property test for successful response completeness
    - **Property 10: Successful Response Completeness**
    - **Validates: Requirements 8.6**
  
  - [ ]* 9.8 Write property test for audio retrieval authorization
    - **Property 12: Audio Retrieval Authorization**
    - **Validates: Requirements 10.7**

- [ ] 10. Implement rate limiting
  - [ ] 10.1 Add rate limiting to /api/v1/sos/analyze endpoint
    - Use Redis to track submission counts per user
    - Limit to 10 submissions per hour per user
    - Return 429 error with retry-after header when limit exceeded
    - Reset counter every hour
    - Log rate limit violations
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6_
  
  - [ ]* 10.2 Write unit tests for rate limiting
    - Test 10 submissions succeed
    - Test 11th submission returns 429
    - Test rate limit reset after 1 hour
    - _Requirements: 11.1, 11.2, 11.4_

- [ ] 11. Implement comprehensive audit logging
  - [ ] 11.1 Add logging to all critical operations
    - Log transcription attempts (success/failure) in WhisperService
    - Log extraction attempts (success/failure) in LLMExtractor
    - Log fallback activations in FallbackHandler
    - Log rate limit violations in rate limiter
    - Log audio file access attempts in audio retrieval endpoint
    - Include timestamp, user_id, event type, and relevant details in all logs
    - _Requirements: 3.7, 7.6, 11.6, 12.6_
  
  - [ ]* 11.2 Write property test for audit logging
    - **Property 13: Comprehensive Audit Logging**
    - **Validates: Requirements 3.7, 7.6, 11.6, 12.6**

- [ ] 12. Implement push notification on completion
  - [ ] 12.1 Add push notification to Celery task
    - Send push notification to mobile app when task completes
    - Include extracted data in notification payload
    - Use existing Firebase FCM integration
    - _Requirements: 9.5_
  
  - [ ]* 12.2 Write property test for push notification
    - **Property 14: Push Notification on Completion**
    - **Validates: Requirements 9.5**

- [ ] 13. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement mobile voice recorder component
  - [ ] 14.1 Create VoiceRecorderButton React Native component
    - Create component with recording state management (idle/recording/uploading/success/error)
    - Implement startRecording using expo-av Audio API
    - Implement stopRecording that returns audio URI
    - Add visual feedback during recording (animation, timer)
    - Support press-and-hold recording (continuous until release)
    - Implement 60-second max duration with auto-stop
    - Validate recording duration is between 1-60 seconds
    - Request microphone permission and handle denial
    - Encode audio in M4A format (compatible with Whisper)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_
  
  - [ ]* 14.2 Write unit tests for voice recorder
    - Test recording state transitions
    - Test max duration auto-stop
    - Test permission denial handling
    - _Requirements: 1.5, 1.6, 1.8_

- [ ] 15. Implement mobile SOS service API client
  - [ ] 15.1 Create SOSService class
    - Implement analyzeSOS method that sends multipart/form-data
    - Include audio_file, user_id, timestamp, latitude, longitude in request
    - Send to POST /api/v1/sos/analyze endpoint
    - Implement 3-second timeout per attempt
    - Implement retry logic (2 retries on failure)
    - Compress audio if network connectivity is poor
    - Store recording locally if all retries fail
    - Display upload progress to user
    - Implement getSOSStatus method to query task status
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [ ]* 15.2 Write property test for audio upload format
    - **Property 1: Valid Audio Upload Format**
    - **Validates: Requirements 1.9, 2.2, 2.3**
  
  - [ ]* 15.3 Write unit tests for upload retry logic
    - Test retry on failure
    - Test local storage on all failures
    - _Requirements: 2.5, 2.6_

- [ ] 16. Integrate voice recorder into emergency screen
  - [ ] 16.1 Add VoiceRecorderButton to emergency screen UI
    - Place button prominently on emergency screen
    - Wire onRecordingComplete handler to call SOSService.analyzeSOS
    - Get GPS coordinates using expo-location
    - Display "Processing your S.O.S..." message after upload
    - Poll SOSService.getSOSStatus to check processing status
    - Display extracted data when processing completes
    - Handle errors and display user-friendly messages
    - _Requirements: 1.1, 2.1, 9.4_

- [ ] 17. Implement privacy and data retention
  - [ ] 17.1 Add privacy notice UI
    - Display privacy notice before first voice recording
    - Explain data usage (audio storage, AI processing, emergency contact sharing)
    - Require user acceptance before enabling feature
    - _Requirements: 12.7_
  
  - [ ] 17.2 Implement data retention cleanup
    - Create Celery periodic task to delete audio files older than 30 days
    - Implement user endpoint DELETE /api/v1/sos/{sos_id} to delete own records
    - Implement cascade deletion on user account deletion
    - _Requirements: 12.2, 12.3, 12.4_
  
  - [ ]* 17.3 Write unit tests for data retention
    - Test 30-day cleanup
    - Test user deletion
    - Test account deletion cascade
    - _Requirements: 12.2, 12.3, 12.4_

- [ ] 18. Add configuration and environment variables
  - Add all required environment variables to .env.example
  - Document configuration in backend/README.md
  - Add Whisper API key, Anthropic API key, audio storage path, rate limits
  - Configure Celery broker and result backend
  - _Requirements: All_

- [ ] 19. Final checkpoint - Integration testing
  - Test end-to-end flow: Record → Upload → Process → Notify
  - Test fallback scenarios with simulated API failures
  - Test rate limiting with 11 submissions
  - Test audio retrieval authorization
  - Verify all property tests pass with 100+ iterations
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Backend uses Python 3.11 + FastAPI + SQLAlchemy + Celery + Redis
- Mobile uses React Native + Expo + expo-av for audio recording
- All code must follow Turkish naming conventions where appropriate (durum, kisi_sayisi, aciliyet)
- Integration with existing Emergency Contact Alert system at /api/v1/emergency
