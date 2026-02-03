from typing import List, Optional

from pydantic import BaseModel, Field


class VisualLocationPrediction(BaseModel):
    country: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    neighborhood: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class VisualMatch(BaseModel):
    provider: str
    source_url: Optional[str] = None
    image_url: Optional[str] = None
    title: Optional[str] = None
    similarity_percent: float = Field(ge=0.0, le=100.0)
    confidence_0_1: float = Field(ge=0.0, le=1.0)
    location_hint: Optional[VisualLocationPrediction] = None


class LocationEvidence(BaseModel):
    source: str
    confidence_0_1: float = Field(ge=0.0, le=1.0)
    url: Optional[str] = None


class ComplianceCheck(BaseModel):
    consent_required: bool = True
    consent_received: bool
    images_stored: bool = False
    credits_consumed: int
    providers_used: List[str]
    trace_id: Optional[str] = None
    ab_variant: Optional[str] = None


class VisualSimilarityLocationReport(BaseModel):
    predicted_location: VisualLocationPrediction
    confidence_0_1: float = Field(ge=0.0, le=1.0)
    matches: List[VisualMatch]
    location_sources: List[LocationEvidence] = []
    compliance: ComplianceCheck
    mandatory_notice: str
