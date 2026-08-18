from pydantic import BaseModel
from typing import Optional, List

class AnalyzeRequest(BaseModel):
    text: str
    prompt: Optional[str] = None

class AnalyzeResponse(BaseModel):
    summary: str
    problemStatement: str
    solution: str
    domain: str
    technologyStack: str
    keywords: str
    tags: str
    mentorRequirements: str
    investorPitch: str
    businessModel: str
    fundingPurpose: str
    
class HealthResponse(BaseModel):
    status: str
    message: str
    provider: str