"""Storage and startup checks; uses a disposable SQLite file, never live data."""
import asyncio
import os
import tempfile
from pathlib import Path

os.environ.setdefault("FIREBASE_PROJECT_ID", "optiroute-51406")

from fastapi.testclient import TestClient
from optiroute import database as db
from optiroute.remote_db import Connection
from optiroute.main import app


async def verify_storage(path):
    async def connect():
        return Connection(path.as_uri(), None)

    db.get_connection = connect
    await db.init_db()
    await db.create_user("deployment-check", "check@example.invalid", "deployment-uid", "Check")
    user = await db.get_user_by_firebase_uid("deployment-uid")
    assert user["client_id"] == "deployment-check"
    connection = await connect()
    await connection.execute("BEGIN IMMEDIATE")
    await connection.execute("UPDATE users SET organization_name = 'rolled back' WHERE client_id = ?", ("deployment-check",))
    await connection.close()
    assert (await db.get_user_by_firebase_uid("deployment-uid"))["organization_name"] == "Check"
    connection = await connect()
    async with connection.execute("SELECT client_id FROM users WHERE firebase_uid = ?", ("deployment-uid",)) as cursor:
        assert dict(await cursor.fetchone()) == {"client_id": "deployment-check"}
    await connection.close()


with tempfile.TemporaryDirectory() as directory:
    path = Path(directory) / "test.db"
    asyncio.run(verify_storage(path))
    with TestClient(app) as client:
        assert client.get("/health").json() == {"status": "ok"}
        assert client.post("/v1/chat/completions", json={"messages": [{"role": "user", "content": "hello"}]}).status_code == 401
    print("PASS: schema, user persistence across connections, rollback, row mapping, startup, health, authentication guard")
