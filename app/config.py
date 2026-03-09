from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
ARTIFACT_DIR = DATA_DIR / "artifacts"
DB_PATH = BASE_DIR / "pipeline_local.db"
