"""Small aiosqlite-compatible interface for a remote libSQL database."""
import sqlite3

import libsql_client


class Row:
    def __init__(self, row):
        self._row = row

    def keys(self):
        return self._row._fields

    def __getitem__(self, key):
        return self._row[key]

    def __iter__(self):
        return iter(self._row)


class Cursor:
    def __init__(self, result):
        self.rows = iter(Row(row) for row in result.rows)
        self.rowcount = result.rows_affected
        self.lastrowid = result.last_insert_rowid

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
    def __init__(self, url, token):
        if url.startswith("https://"):
            url = "libsql://" + url.removeprefix("https://")
        self.client = libsql_client.create_client(url, auth_token=token)
        self.transaction = None

    def execute(self, sql, args=()):
        return Query(self._execute(sql, args))

    async def _execute(self, sql, args):
        command = sql.lstrip().split()[0].upper()
        if command == "BEGIN":
            if self.transaction is not None:
                raise RuntimeError("Transaction already open")
            self.transaction = self.client.transaction()
            # The client opens the transaction on its first statement.
            return Cursor(await self.transaction.execute("SELECT 1"))
        if self.transaction is None and command in {"INSERT", "UPDATE", "DELETE", "REPLACE"}:
            self.transaction = self.client.transaction()
        executor = self.transaction or self.client
        return Cursor(await executor.execute(sql, list(args)))

    async def executescript(self, script):
        statement = ""
        for line in script.splitlines(keepends=True):
            statement += line
            if sqlite3.complete_statement(statement):
                await self.execute(statement)
                statement = ""
        if statement.strip():
            await self.execute(statement)

    async def commit(self):
        if self.transaction is not None:
            await self.transaction.commit()
            self.transaction = None

    async def rollback(self):
        if self.transaction is not None:
            await self.transaction.rollback()
            self.transaction = None

    async def close(self):
        try:
            await self.rollback()
        finally:
            await self.client.close()
