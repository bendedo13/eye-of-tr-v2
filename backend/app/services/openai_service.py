"""
OpenAI ChatGPT API Integration Service

This module provides AI-enhanced explanations for FaceSeek search results.
All outputs follow responsible AI guidelines with hedging language and no legal claims.
"""
import logging
from typing import Optional, List, Dict, Any
from openai import OpenAI, OpenAIError
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIService:
    """Service for generating AI-enhanced search explanations using ChatGPT API"""
    
    def __init__(self):
        """Initialize OpenAI client if API key is available"""
        self.client: Optional[OpenAI] = None
        self.enabled = settings.OPENAI_ENABLED and bool(settings.OPENAI_API_KEY)
        
        if self.enabled:
            try:
                self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info(f"OpenAI service initialized with model: {settings.OPENAI_MODEL}")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self.enabled = False
        else:
            logger.info("OpenAI service disabled (missing API key or feature flag off)")
    
    def is_available(self) -> bool:
        """Check if OpenAI service is available and enabled"""
        return self.enabled and self.client is not None
    
    def generate_search_explanation(
        self,
        matches: List[Dict[str, Any]],
        total_matches: int,
        search_params: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Generate a human-readable explanation of search results.
        
        Args:
            matches: List of search match results with confidence scores
            total_matches: Total number of matches found
            search_params: Optional search parameters (precision, filters, etc.)
        
        Returns:
            AI-generated explanation string, or None if service unavailable
        """
        if not self.is_available():
            logger.debug("OpenAI service not available, skipping explanation generation")
            return None
        
        try:
            # Prepare context for AI
            match_summary = []
            for i, match in enumerate(matches[:3], 1):  # Limit to top 3 for context
                confidence = match.get('confidence', 0)
                platform = match.get('platform', 'unknown')
                match_summary.append(f"Match {i}: {platform} platform, {confidence:.1f}% confidence")
            
            context = "\n".join(match_summary)
            
            # Construct responsible AI prompt
            prompt = f"""Analyze these face search results and provide a brief, professional summary in Turkish.

Search Results:
- Total matches found: {total_matches}
- Top matches:
{context}

Instructions:
- Write 2-3 sentences in Turkish
- Focus on technical similarity metrics and match quality
- Use hedging language: "olası", "benziyor", "işaret edebilir"
- DO NOT make definitive identity claims
- DO NOT include legal or criminal implications
- Keep response professional and informative

Output in Turkish, concise and factual."""

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Sen FaceSeek yüz tanıma sisteminin analiz asistanısın. Sonuçları profesyonel, bilimsel ve sorumlu bir dilde açıklarsın. Kesinlik iddiasında bulunmaz, yumuşak bir dil kullanırsın."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=200,
                temperature=0.7,
                n=1
            )
            
            explanation = response.choices[0].message.content.strip()
            logger.info(f"Generated AI explanation ({len(explanation)} chars)")
            return explanation
            
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating explanation: {e}")
            return None
    
    def explain_match_confidence(
        self,
        confidence: float,
        platform: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Generate an explanation for why a specific match has its confidence score.
        
        Args:
            confidence: Confidence score (0-100)
            platform: Source platform name
            metadata: Optional metadata about the match
        
        Returns:
            AI-generated explanation, or None if service unavailable
        """
        if not self.is_available():
            return None
        
        try:
            prompt = f"""Explain this face recognition match result in Turkish (1-2 sentences).

Match Details:
- Confidence: {confidence:.1f}%
- Source: {platform}

Instructions:
- Explain what this confidence level means
- Use simple, clear Turkish
- Use hedging language (e.g., "yüksek benzerlik", "olası eşleşme")
- DO NOT claim absolute certainty

Output in Turkish, brief and clear."""

            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Sen yüz tanıma sonuçlarını açıklayan bir asistansın. Basit, anlaşılır Türkçe kullan."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=100,
                temperature=0.6,
                n=1
            )
            
            explanation = response.choices[0].message.content.strip()
            return explanation
            
        except Exception as e:
            logger.error(f"Error explaining match confidence: {e}")
            return None
    
    def analyze_visual_cues(
        self,
        match_data: Dict[str, Any]
    ) -> Optional[str]:
        """
        Analyze and describe visual/environmental cues from a match.
        
        Args:
            match_data: Match data including metadata and context
        
        Returns:
            AI-generated visual cue analysis, or None if unavailable
        """
        if not self.is_available():
            return None
        
        try:
            # Extract relevant visual context
            metadata = match_data.get('metadata', {})
            
            prompt = f"""Based on this face search match metadata, describe potential visual cues in Turkish.

Match Info:
- Platform: {match_data.get('platform', 'unknown')}
- Confidence: {match_data.get('confidence', 0):.1f}%

Instructions:
- Describe what visual signals contribute to this match
- Use scientific, technical language
- Keep it brief (1-2 sentences)
- Use hedging: "olabilir", "işaret edebilir"
- Focus on technical aspects, not identity

Output in Turkish."""

            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Sen görsel analiz uzmanısın. Teknik ve bilimsel bir dil kullanırsın."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=120,
                temperature=0.7,
                n=1
            )
            
            analysis = response.choices[0].message.content.strip()
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing visual cues: {e}")
            return None


# Global service instance
_openai_service: Optional[OpenAIService] = None


def get_openai_service() -> OpenAIService:
    """Get or create the global OpenAI service instance"""
    global _openai_service
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service
