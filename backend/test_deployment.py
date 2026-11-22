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
from cryptography.fernet import Fernet
from unittest.mock import patch
from optiroute import database as db
from optiroute.remote_db import Connection, encode, decode
from optiroute.main import app
from optiroute.config import get_config
from optiroute.connections import config_for_user
from optiroute.engine.cache_manager import CacheManager
from optiroute.models import ChatCompletionRequest, ChatCompletionResponse, Choice, ChoiceMessage
from types import SimpleNamespace
import numpy as np


async def verify_storage(path):
    async def connect():
        local = sqlite3.connect(path, check_same_thread=False)
        local.execute("PRAGMA foreign_keys=ON")
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

    # Exercise the failed production path: saving a model answer before returning it.
    manager = CacheManager()
    original_model = CacheManager._model
    CacheManager._model = SimpleNamespace(encode=lambda text, **kwargs: np.array([1.0, 0.0]))
    try:
        request = ChatCompletionRequest(messages=[{"role": "user", "content": "tell me about qutub minar"}])
        response = ChatCompletionResponse(
            model="openai/gpt-oss-20b",
            choices=[Choice(message=ChoiceMessage(content="Qutub Minar is a historic minaret in Delhi."))],
        )
        assert await manager.check_cache(request, "deployment-check", "deployment-uid") is None
        await manager.save_cache(request, response, "deployment-check", "deployment-uid")
        hit = await manager.check_cache(request, "deployment-check", "deployment-uid")
        assert hit and hit[0].choices[0].message.content == response.choices[0].message.content
        assert hit[1] == "exact"
        await manager.save_cache(request, response, "deployment-check", "deployment-uid")
        connection = await connect()
        row = await (await connection.execute("SELECT COUNT(*) FROM semantic_cache WHERE owner_uid = ?", ("deployment-uid",))).fetchone()
        assert row[0] == 1, "Repeated saves must reuse the existing cache entry"
        await connection.close()

        # Existing production-shaped data must still be usable after startup with uploads enabled.
        encryption_key = Fernet.generate_key()
        ciphertext = Fernet(encryption_key).encrypt(b"fixture-provider-key").decode()
        await db.create_model_connection({
            "connection_id": "existing-connection", "client_id": "deployment-check",
            "tier": "light", "name": "Existing model", "provider": "groq",
            "model_id": response.model, "encrypted_api_key": ciphertext, "max_tokens": 8192,
            "cost_per_1k_input": 0.0, "cost_per_1k_output": 0.0,
        })
        await db.save_chat("existing-chat", "deployment-check", "Existing chat",
                           request.messages[0].content, response.model_dump_json(),
                           response.model, "light", 0.0, 0.0)
        with patch.dict(os.environ, {"FEATURE_FILE_UPLOAD": "true",
                                     "WORKFLOW_ENCRYPTION_KEY": encryption_key.decode()}):
            from optiroute.file_upload import Upload, encrypt_uploads, load_saved_upload

            await db.init_db()
            config, connected = await config_for_user(get_config(), "deployment-check")
            assert connected and config.tiers["light"].models[0].resolve_api_key() == "fixture-provider-key"
            assert (await db.get_model_connections("deployment-check"))[0]["encrypted_api_key"] == ciphertext
            chat = await db.get_chat_by_id("existing-chat", "deployment-check")
            assert chat and chat["title"] == "Existing chat"
            assert await manager.check_cache(request, "deployment-check", "deployment-uid")
            file = Upload("fixture.txt", "text/plain", b"sample content\n" * 47000, "")
            parts = encrypt_uploads([file])
            assert len(parts) > 1 and all("sample content" not in part[2] for part in parts)
            await db.save_chat("file-chat", "deployment-check", "File chat", "Read this file",
                               response.model_dump_json(), response.model, "light", 0.0, 0.0,
                               attachment_parts=parts)
            await db.init_db()
            restored = await load_saved_upload("file-chat", "deployment-check", "file-chat", 0, vars(file))
            assert restored.content == file.content
            assert not await db.get_attachment_parts("file-chat", "other-owner", "file-chat", 0)
            await db.delete_cache_entries("deployment-uid", "deployment-check", [], ["file-chat"])
            assert not await db.get_attachment_parts("file-chat", "deployment-check", "file-chat", 0)
    finally:
        CacheManager._model = original_model
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
    print("PASS: schema, Turso adapter, rollback, cache isolation, startup, authentication, and preservation of existing chats and encrypted model connections")
