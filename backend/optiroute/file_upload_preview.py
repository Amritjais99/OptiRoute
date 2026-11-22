"""Start the preview API only when its storage is isolated from production."""

import os

if (os.getenv("TURSO_DATABASE_URL") or os.getenv("TURSO_AUTH_TOKEN")
        or os.getenv("REQUIRE_REMOTE_DATABASE", "").lower() in {"1", "true", "on"}):
    raise RuntimeError("File upload preview requires an isolated local database.")

from optiroute.main import app
