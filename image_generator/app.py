import time
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import config
from .generator import LocalImageGenerator

app = FastAPI(
    title="Episode Splitter — Local AI Image Generator",
    description="Self-hosted open-source text-to-image API for Android and Web",
    version="1.0.0"
)

# Enable CORS for Android client and web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated image outputs
app.mount("/outputs", StaticFiles(directory=str(config.OUTPUTS_DIR)), name="outputs")

generator = LocalImageGenerator()

class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000, description="Text prompt to generate")
    negative_prompt: Optional[str] = Field(None, description="Negative prompt elements to exclude")
    width: int = Field(512, ge=config.MIN_DIM, le=config.MAX_WIDTH)
    height: int = Field(512, ge=config.MIN_DIM, le=config.MAX_HEIGHT)
    steps: int = Field(20, ge=1, le=config.MAX_STEPS)
    seed: Optional[int] = Field(None, description="Deterministic integer seed, or -1 for random")
    guidance_scale: float = Field(7.5, ge=0.0, le=20.0)

class GenerateResponse(BaseModel):
    success: bool
    image: str
    image_url: str
    seed: int
    duration_seconds: float
    width: int
    height: int

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EpisodeSplitter AI Image Generator",
        "device": generator._device,
        "model_id": config.MODEL_ID,
        "max_resolution": f"{config.MAX_WIDTH}x{config.MAX_HEIGHT}"
    }

@app.get("/")
def root():
    return {
        "name": "Episode Splitter Local Image Generator",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "health": "GET /health",
            "generate": "POST /generate",
            "outputs": "GET /outputs/{filename}"
        }
    }

@app.post("/generate", response_model=GenerateResponse)
def generate_image(req: GenerateRequest, request: Request):
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    start_time = time.time()
    try:
        relative_url, abs_path, used_seed = generator.generate(
            prompt=req.prompt.strip(),
            negative_prompt=req.negative_prompt,
            width=req.width,
            height=req.height,
            steps=req.steps,
            seed=req.seed if (req.seed is not None and req.seed >= 0) else None,
            guidance_scale=req.guidance_scale
        )

        base_url = str(request.base_url).rstrip("/")
        full_url = f"{base_url}{relative_url}"
        elapsed = round(time.time() - start_time, 3)

        return GenerateResponse(
            success=True,
            image=relative_url,
            image_url=full_url,
            seed=used_seed,
            duration_seconds=elapsed,
            width=req.width,
            height=req.height
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.HOST, port=config.PORT)
