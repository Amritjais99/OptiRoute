"""Storage and startup checks; uses a disposable SQLite file, never live data."""
import asyncio
import os
import tempfile
import json
import sqlite3
import httpx
from pathlib import Path

os.environ.setdefault("FIREBASE_PROJECT_ID", "optiroute-10488")

from fastapi.testclient import TestClient
from optiroute import database as db
from optiroute.remote_db import Connection, encode, decode
from optiroute.main import app


async def verify_storage(path):
    async def connect():
        local = sqlite3.connect(path, check_same_thread=False)
        baton = None
        sequence = 0
        def server(request):
            nonlocal baton, sequence
            assert request.url.path == "/v2/pipeline"
            assert request.headers["authorization"] == "Bearer test-only"
            body = json.loads(request.content)
            assert body["baton"] == baton
            results = []
            closed = False
            for operation in body["requests"]:
                if operation["type"] == "close":
                    local.close()
                    closed = True
                    results.append({"type": "ok", "response": {"type": "close"}})
                    continue
                stmt = operation["stmt"]
                try:
                    cursor = local.execute(stmt["sql"], [decode(v) for v in stmt.get("args", [])])
                    result = {"cols": [{"name": c[0]} for c in cursor.description or []], "rows": [[encode(v) for v in row] for row in cursor.fetchall()], "affected_row_count": max(cursor.rowcount, 0), "last_insert_rowid": cursor.lastrowid}
                    results.append({"type": "ok", "response": {"type": "execute", "result": result}})
                except sqlite3.Error as exc:
                    results.append({"type": "error", "error": {"code": "SQLITE_ERROR", "message": str(exc)}})
            sequence += 1
            baton = None if closed else f"baton-{sequence}"
            return httpx.Response(200, json={"baton": baton, "results": results})
        return Connection("libsql://test.invalid", "test-only", transport=httpx.MockTransport(server))

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
