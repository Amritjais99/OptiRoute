import json
import os
from pathlib import Path

from pydantic import BaseModel, Field

SETTINGS = json.loads(Path(__file__).with_name("file_upload_config.json").read_text(encoding="utf-8"))
FILE_SCOPE_PREFIX = "files-v1:"


def enabled() -> bool:
    return os.getenv("FEATURE_FILE_UPLOAD", "").strip().lower() in {"1", "true", "on"}


class Capabilities(BaseModel):
    image: bool = False
    imageTokens: int | None = Field(default=None, ge=1)
    pdf: bool = False
    docx: bool = False
    maxContextTokens: int = Field(default=SETTINGS["defaultContextTokens"], ge=512, le=2_000_000)


def capabilities_for(provider: str, model_id: str) -> Capabilities:
    return Capabilities(**SETTINGS["models"].get(f"{provider}/{model_id.removeprefix('models/')}", {}))
