import json
import os
from pathlib import Path

from fastapi import HTTPException
from pydantic import BaseModel, Field

SETTINGS = json.loads(Path(__file__).with_name("file_upload_config.json").read_text(encoding="utf-8"))
FILE_SCOPE_PREFIX = "files-v1:"


def enabled() -> bool:
    return os.getenv("FEATURE_FILE_UPLOAD", "").strip().lower() in {"1", "true", "on"}


class Capabilities(BaseModel):
    image: bool = False
    pdf: bool = False
    docx: bool = False
    maxContextTokens: int = Field(default=SETTINGS["defaultContextTokens"], ge=512, le=2_000_000)


def capabilities_for(provider: str, model_id: str) -> Capabilities:
    return Capabilities(**SETTINGS["models"].get(f"{provider}/{model_id.removeprefix('models/')}", {}))


async def init_file_capabilities() -> None:
    from optiroute.database import get_connection

    db = await get_connection()
    try:
        await db.execute(
            "CREATE TABLE IF NOT EXISTS file_capability_overrides ("
            "connection_id TEXT PRIMARY KEY, settings TEXT NOT NULL, "
            "FOREIGN KEY (connection_id) REFERENCES model_connections(connection_id) ON DELETE CASCADE)"
        )
        await db.commit()
    finally:
        await db.close()


async def user_overrides(client_id: str) -> dict[str, Capabilities]:
    from optiroute.database import get_connection

    db = await get_connection()
    try:
        cursor = await db.execute(
            "SELECT o.connection_id, o.settings FROM file_capability_overrides o "
            "JOIN model_connections m ON m.connection_id = o.connection_id WHERE m.client_id = ?",
            (client_id,),
        )
        return {row["connection_id"]: Capabilities.model_validate_json(row["settings"])
                for row in await cursor.fetchall()}
    finally:
        await db.close()


async def update_override(client_id: str, connection_id: str, value: Capabilities) -> None:
    from optiroute.database import get_connection

    db = await get_connection()
    try:
        cursor = await db.execute(
            "INSERT INTO file_capability_overrides (connection_id, settings) "
            "SELECT connection_id, ? FROM model_connections WHERE client_id = ? AND connection_id = ? "
            "ON CONFLICT(connection_id) DO UPDATE SET settings = excluded.settings",
            (value.model_dump_json(), client_id, connection_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(404, "Model connection not found. Refresh Routing Policies and try again.")
        await db.commit()
    finally:
        await db.close()
