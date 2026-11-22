"""Serve the isolated preview build from the same origin as its preview API."""

import os
from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from optiroute.main import app

if os.getenv("TURSO_DATABASE_URL") or os.getenv("REQUIRE_REMOTE_DATABASE", "").lower() in {"1", "true", "on"}:
    raise RuntimeError("File upload preview requires an isolated local database.")

site = Path(os.getenv("OPTIROUTE_PREVIEW_SITE", "/app/site")).resolve()
app.mount("/assets", StaticFiles(directory=site / "assets"), name="assets")


@app.get("/{path:path}", include_in_schema=False)
async def website(path: str):
    if path.startswith(("api/", "admin/", "v1/")):
        raise HTTPException(404)
    if path in {"favicon.svg", "icons.svg", "third-party-notices.txt"}:
        return FileResponse(site / path)
    return FileResponse(site / "index.html")
