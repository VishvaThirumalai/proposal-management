from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routes import analyze
from sentence_transformers import SentenceTransformer
import numpy as np
from pydantic import BaseModel
from typing import List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ Load embedding model once at startup
model = SentenceTransformer('all-MiniLM-L6-v2')

app = FastAPI(title="StartupHub AI Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Embedding Models
# ==========================================

class EmbeddingRequest(BaseModel):
    texts: List[str]

class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]

@app.post("/embed", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """Generate embeddings for a list of texts"""
    try:
        if not request.texts or len(request.texts) == 0:
            raise HTTPException(status_code=400, detail="No texts provided")
        
        logger.info(f"📝 Generating embeddings for {len(request.texts)} texts")
        embeddings = model.encode(request.texts).tolist()
        logger.info(f"✅ Embeddings generated successfully")
        return EmbeddingResponse(embeddings=embeddings)
    except Exception as e:
        logger.error(f"❌ Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/similarity")
async def calculate_similarity(request: EmbeddingRequest):
    """Calculate cosine similarity between two texts"""
    try:
        if len(request.texts) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 texts")
        
        embeddings = model.encode(request.texts)
        similarity = np.dot(embeddings[0], embeddings[1]) / (
            np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
        )
        return {"similarity": float(similarity)}
    except Exception as e:
        logger.error(f"❌ Similarity calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/embed/health")
async def embed_health():
    """Health check for embedding service"""
    return {
        "status": "healthy",
        "model": "all-MiniLM-L6-v2",
        "embedding_dim": 384
    }

# ==========================================
# Existing Routes
# ==========================================

# ✅ Include analyze router
app.include_router(analyze.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "AI Service is running"}

@app.get("/")
async def root():
    return {
        "service": "StartupHub AI Service",
        "version": "1.0.0",
        "endpoints": [
            {"path": "/analyze/", "method": "POST", "description": "Analyze a proposal"},
            {"path": "/embed", "method": "POST", "description": "Generate embeddings"},
            {"path": "/similarity", "method": "POST", "description": "Calculate similarity"},
            {"path": "/health", "method": "GET", "description": "Health check"}
        ]
    }