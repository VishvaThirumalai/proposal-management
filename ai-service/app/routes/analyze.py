from fastapi import APIRouter, HTTPException
from app.models import AnalyzeRequest, AnalyzeResponse
from app.services.llm_service import llm_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["analyze"])

# ✅ Handle both with and without trailing slash
@router.post("/", response_model=AnalyzeResponse)  # With trailing slash
@router.post("", response_model=AnalyzeResponse)   # Without trailing slash
async def analyze_proposal(request: AnalyzeRequest):
    """Analyze a startup proposal using LLM"""
    try:
        if not request.text or len(request.text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Text is too short. Please provide at least 10 characters."
            )
        
        logger.info(f"📝 Analyzing proposal (length: {len(request.text)} chars)")
        
        result = llm_service.analyze_proposal(
            text=request.text,
            prompt=request.prompt
        )
        
        logger.info("✅ Analysis completed successfully")
        
        return AnalyzeResponse(
            summary=result.get("summary", ""),
            problemStatement=result.get("problemStatement", ""),
            solution=result.get("solution", ""),
            domain=result.get("domain", ""),
            technologyStack=result.get("technologyStack", ""),
            keywords=result.get("keywords", ""),
            tags=result.get("tags", ""),
            mentorRequirements=result.get("mentorRequirements", ""),
            investorPitch=result.get("investorPitch", ""),
            businessModel=result.get("businessModel", ""),
            fundingPurpose=result.get("fundingPurpose", "")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))