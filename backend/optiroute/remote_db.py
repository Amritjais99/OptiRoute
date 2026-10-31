"""Small aiosqlite-compatible interface for a remote libSQL database."""
import sqlite3

import base64
import httpx
from urllib.parse import urlsplit


def encode(value):
    if value is None:
        return {"type": "null"}
    if isinstance(value, (bool, int)):
        return {"type": "integer", "value": str(int(value))}
    if isinstance(value, float):
        return {"type": "float", "value": value}
    if isinstance(value, bytes):
        return {"type": "blob", "base64": base64.b64encode(value).decode()}
    return {"type": "text", "value": str(value)}


def decode(value):
    kind = value["type"]
    if kind == "null":
        return None
    if kind == "integer":
        return int(value["value"])
    if kind == "float":
        return float(value["value"])
    if kind == "blob":
        return base64.b64decode(value["base64"])
    return value["value"]


class Row:
    def __init__(self, columns, row):
        self.columns, self._row = columns, row

    def keys(self):
        return self.columns

    def __getitem__(self, key):
        return self._row[self.columns.index(key)] if isinstance(key, str) else self._row[key]

    def __iter__(self):
        return iter(self._row)


class Cursor:
    def __init__(self, result):
        columns = [col["name"] for col in result.get("cols", [])]
        self.rows = iter(Row(columns, [decode(v) for v in row]) for row in result.get("rows", []))
        self.rowcount = result.get("affected_row_count", 0)
        value = result.get("last_insert_rowid")
        self.lastrowid = int(value) if value is not None else None

    async def fetchone(self):
        return next(self.rows, None)

    async def fetchall(self):
        return list(self.rows)

    async def close(self):
        pass


class Query:
    def __init__(self, operation):
        self.operation = operation

    def __await__(self):
        return self.operation.__await__()

    async def __aenter__(self):
        self.cursor = await self.operation
        return self.cursor

    async def __aexit__(self, *args):
        await self.cursor.close()


class Connection:
    def __init__(self, url, token, *, transport=None):
        parsed = urlsplit(url)
        if parsed.scheme not in {"libsql", "turso", "https"} or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError("A secure Turso database URL is required")
        self.endpoint = "https://" + parsed.netloc + "/v2/pipeline"
        self.client = httpx.AsyncClient(headers={"Authorization": f"Bearer {token}"}, timeout=20, transport=transport)
        self.baton = None
        self.transaction = False

    async def _pipeline(self, requests):
        response = await self.client.post(self.endpoint, json={"baton": self.baton, "requests": requests})
        response.raise_for_status()
        data = response.json()
        self.baton = data.get("baton")
        results = []
        for item in data["results"]:
            if item["type"] == "error":
                error = item.get("error", {})
                raise RuntimeError(f"Database query failed ({error.get('code', 'UNKNOWN')}): {error.get('message', '')}")
            results.append(item["response"].get("result", {}))
        return results

    def execute(self, sql, args=()):
        return Query(self._execute(sql, args))

    async def _execute(self, sql, args):
        command = sql.lstrip().split()[0].upper()
        requests = []
        implicit = not self.transaction and command in {"INSERT", "UPDATE", "DELETE", "REPLACE"}
        if implicit:
            requests.append({"type": "execute", "stmt": {"sql": "BEGIN IMMEDIATE"}})
        requests.append({"type": "execute", "stmt": {"sql": sql, "args": [encode(v) for v in args], "want_rows": True}})
        if implicit or command == "BEGIN":
            self.transaction = True
        return Cursor((await self._pipeline(requests))[-1])

    async def executescript(self, script):
        statement = ""
        requests = []
        for line in script.splitlines(keepends=True):
            statement += line
            if sqlite3.complete_statement(statement):
                requests.append({"type": "execute", "stmt": {"sql": statement}})
                statement = ""
        if statement.strip():
            requests.append({"type": "execute", "stmt": {"sql": statement}})
        if requests:
            await self._pipeline(requests)

    async def commit(self):
        if self.transaction:
            await self._pipeline([{"type": "execute", "stmt": {"sql": "COMMIT"}}])
            self.transaction = False

    async def rollback(self):
        if self.transaction:
            await self._pipeline([{"type": "execute", "stmt": {"sql": "ROLLBACK"}}])
            self.transaction = False

    async def close(self):
        try:
            if self.baton:
                # Closing the server connection rolls back unfinished writes.
                await self._pipeline([{"type": "close"}])
        finally:
            await self.client.aclose()
