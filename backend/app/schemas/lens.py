from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class VisualMatch(BaseModel):
    title: Optional[str] = None
    source: Optional[str] = None
    link: Optional[str] = None
    thumbnail: Optional[str] = None
    position: Optional[int] = None

class KnowledgeGraph(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[Dict[str, Any]]] = None
    attributes: Optional[Dict[str, Any]] = None

class LensAnalysisResult(BaseModel):
    visual_matches: List[VisualMatch] = []
    knowledge_graph: Optional[KnowledgeGraph] = None
    text_segments: List[str] = []
    raw_data: Optional[Dict[str, Any]] = None

class LensAnalysisResponse(BaseModel):
    status: str
    data: LensAnalysisResult
    search_type: str
    created_at: datetime
