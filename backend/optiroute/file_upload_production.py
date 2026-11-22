"""Start the OCR image against the configured persistent production storage."""

import os

from cryptography.fernet import Fernet

required = ("FIREBASE_PROJECT_ID", "TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "WORKFLOW_ENCRYPTION_KEY")
missing = [name for name in required if not os.getenv(name, "").strip()]
if missing:
    raise RuntimeError(f"Missing required production configuration: {', '.join(missing)}")
if os.getenv("REQUIRE_REMOTE_DATABASE") != "true":
    raise RuntimeError("Production requires REQUIRE_REMOTE_DATABASE=true.")
try:
    Fernet(os.environ["WORKFLOW_ENCRYPTION_KEY"].encode())
except ValueError:
    raise RuntimeError("Invalid production workflow encryption key.") from None

from optiroute.main import app
