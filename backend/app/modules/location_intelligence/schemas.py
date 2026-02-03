from typing import List, Optional

from pydantic import BaseModel, Field


class LocationPrediction(BaseModel):
    country: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    neighborhood: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class LocationIntelligenceResult(BaseModel):
    predicted_location: LocationPrediction
    analysis: str
    confidence: int = Field(ge=0, le=100)
    factors: List[str]
    mandatory_notice: str

