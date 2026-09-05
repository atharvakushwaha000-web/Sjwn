# Episode Splitter — Local AI Image Generator Backend

This module provides a self-hosted, open-source text-to-image server designed for the Episode Splitter Android and Web applications.

## Key Features
- **100% Self-Hosted**: Zero dependence on proprietary third-party APIs (no OpenAI, no Gemini, no Stability AI, no Midjourney).
- **FastAPI Core**: Lightweight, asynchronous REST API with automatic OpenAPI documentation.
- **Model Caching**: Loads the diffusion pipeline once into memory and reuses it for subsequent inferences.
- **Configurable Hardware**: Automatically detects and leverages NVIDIA CUDA, Apple Silicon MPS, or multi-threaded CPU.
- **Parameters**: Supports prompt, negative prompt, width/height (256–1024), inference steps, seed, and guidance scale.

## Setup Instructions

1. Create and activate a Python 3.10+ virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Launch the server:
```bash
uvicorn image_generator.app:app --host 0.0.0.0 --port 8000 --reload
```

4. Verify health status:
```bash
curl http://127.0.0.1:8000/health
```

5. In the Android app or Web UI, navigate to **AI Image Generator** -> set Server URL to `http://127.0.0.1:8000` (or `http://YOUR_LOCAL_IP:8000`) and tap **Test Connection**.
