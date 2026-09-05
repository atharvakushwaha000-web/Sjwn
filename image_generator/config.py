import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent
OUTPUTS_DIR = BASE_DIR / "outputs"
MODELS_DIR = BASE_DIR / "models"

OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Server configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Model configuration
# Defaults to lightweight, fast open-source SD-Turbo / Tiny-SD for fast local generation
MODEL_ID = os.getenv("MODEL_ID", "stabilityai/sd-turbo")
DEVICE = os.getenv("DEVICE", "auto")  # 'cuda', 'mps', 'cpu', or 'auto'

# Limits
MAX_WIDTH = 1024
MAX_HEIGHT = 1024
MIN_DIM = 256
DEFAULT_STEPS = 20
MAX_STEPS = 50
DEFAULT_GUIDANCE = 7.5
