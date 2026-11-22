"""Run with python -m unittest test_file_upload from backend/."""

import io
import json
import os
import shutil
import tempfile
import time
import unittest
import uuid
import zipfile
from pathlib import Path
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

from optiroute import database
from optiroute.config import get_config
from optiroute.file_upload import SETTINGS

FLAG = "false" if os.environ.get("TEST_UPLOAD_FLAG_OFF") == "true" else "true"
with patch.dict(os.environ, {"FEATURE_FILE_UPLOAD": FLAG, "FIREBASE_PROJECT_ID": "optiroute-unit-tests"}):
    from optiroute.auth import get_current_user
    from optiroute.main import app

API = "/v1/chat/completions"
MARKER = "PINEAPPLE GARDEN"


def sample_image(kind):
    image = Image.new("RGB", (1200, 250), "white")
    ImageDraw.Draw(image).text((70, 65), MARKER, font=ImageFont.load_default(size=85), fill="black")
    buffer = io.BytesIO()
    image.save(buffer, kind)
    return buffer.getvalue()


def sample_pdf():
    writer = PdfWriter()
    for words in ("FIRST TEST PAGE", MARKER):
        page = writer.add_blank_page(width=612, height=792)
        font = DictionaryObject({NameObject("/Type"): NameObject("/Font"),
                                 NameObject("/Subtype"): NameObject("/Type1"),
                                 NameObject("/BaseFont"): NameObject("/Helvetica")})
        page[NameObject("/Resources")] = DictionaryObject({
            NameObject("/Font"): DictionaryObject({NameObject("/F1"): font}),
        })
        stream = DecodedStreamObject()
        stream.set_data(f"BT /F1 30 Tf 30 740 Td ({words}) Tj ET".encode())
        page.replace_contents(stream)
    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def sample_docx():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>')
        archive.writestr("word/document.xml",
                         '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
                         f'<w:body><w:p><w:r><w:t>{MARKER}</w:t></w:r></w:p></w:body></w:document>')
    return buffer.getvalue()


class UploadFlow(unittest.TestCase):
    def setUp(self):
        if FLAG == "true":
            from optiroute.main import upload_gate

            upload_gate.recent.clear()
        self.addCleanup(app.dependency_overrides.clear)
        directory = self.enterContext(tempfile.TemporaryDirectory())
        self.enterContext(patch.object(database, "_db_path", return_value=Path(directory) / "test.db"))
        self.enterContext(patch.dict(os.environ, {"TURSO_DATABASE_URL": "", "REQUIRE_REMOTE_DATABASE": "",
                                                  "FEATURE_FILE_UPLOAD": FLAG}))
        self.client = self.enterContext(TestClient(app))
        self.client_id = str(uuid.uuid4())
        self.uid = f"test-{self.client_id}"
        self.client.portal.call(database.create_user, self.client_id, "synthetic@example.invalid", self.uid, "Test")
        app.dependency_overrides[get_current_user] = lambda: {"uid": self.uid, "client_id": self.client_id}
        self.provider_payloads = []
        self.provider = "groq"
        self.model_id = "openai/gpt-oss-120b"
        self.native_response = False
        self.enterContext(patch("optiroute.main.available_model_ids", return_value=None))
        self.enterContext(patch("optiroute.main.config_for_user", side_effect=self.config))
        self.enterContext(patch("optiroute.proxy._post_with_retries", side_effect=self.provider_reply))

    async def config(self, *_):
        from optiroute.config import ModelConfig

        config = get_config().model_copy(deep=True)
        for tier in config.tiers.values():
            tier.models = []
        config.tiers["light"].models.append(ModelConfig(
            id=self.model_id, provider=self.provider, api_base="https://example.invalid/v1",
            api_key="test-only", cost_per_1k_input=0, cost_per_1k_output=0,
        ))
        connection = await database.get_connection()
        try:
            await connection.execute("INSERT OR IGNORE INTO ai_models(model_id, provider_name) VALUES (?, ?)",
                                     (self.model_id, self.provider))
            await connection.commit()
        finally:
            await connection.close()
        return config, True

    async def provider_reply(self, _client, url, payload, _headers, model_id, _retry):
        self.provider_payloads.append(payload)
        if self.native_response:
            return httpx.Response(200, json={
                "id": "gemini-test", "status": "completed", "steps": [
                    {"type": "model_output", "content": [{"type": "text", "text": "Synthetic provider answer."}]}
                ],
            })
        return httpx.Response(200, json={
            "id": str(uuid.uuid4()), "model": model_id,
            "choices": [{"index": 0, "finish_reason": "stop", "message": {
                "role": "assistant", "content": "The attachment contains a label for the demonstration.",
            }}],
            "usage": {"prompt_tokens": 40, "completion_tokens": 10, "total_tokens": 50},
        })

    def send(self, name, data, mime, pages="", **settings):
        request_id = str(uuid.uuid4())
        request = {"request_id": request_id, "messages": [{"role": "user", "content": "Read the label."}],
                   **settings}
        result = self.client.post(API + "/attachment-jobs",
                                  data={"request": json.dumps(request), "pages": json.dumps([pages])},
                                  files={"files": (name, data, mime)})
        if result.status_code != 202:
            return result.json()
        for _ in range(150):
            status = self.client.get(API + f"/{request_id}/status").json()
            if status["status"] != "running":
                return status
            time.sleep(0.1)
        self.fail("Attachment job timed out.")

    def test_text_layer_pdf_range_docx_and_no_raw_input_in_history(self):
        result = self.send("sample.pdf", sample_pdf(), "application/pdf", "2")
        self.assertEqual(result["status"], "completed", result)
        data = self.provider_payloads[-1]["messages"][-1]["content"]
        self.assertIn(MARKER, data)
        self.assertNotIn("FIRST TEST PAGE", data)
        self.assertIn("untrusted", self.provider_payloads[-1]["messages"][0]["content"])
        self.assertNotIn(MARKER, self.client.get("/api/v1/chats").text)
        result = self.send("sample.docx", sample_docx(), SETTINGS["types"]["docx"])
        self.assertEqual(result["status"], "completed", result)
        self.assertIn(MARKER, self.provider_payloads[-1]["messages"][-1]["content"])

    @unittest.skipUnless(shutil.which("tesseract"), "Tesseract executable required")
    def test_real_ocr_png_and_scanned_pdf(self):
        for name, format_name, mime in (("scan.png", "PNG", "image/png"), ("scan.pdf", "PDF", "application/pdf")):
            result = self.send(name, sample_image(format_name), mime)
            self.assertEqual(result["status"], "completed", result)
            self.assertIn(MARKER, self.provider_payloads[-1]["messages"][-1]["content"])

    def test_native_image_and_pdf_parts(self):
        self.provider, self.model_id = "openai", "gpt-4.1-mini"
        for name, content, mime, part_type in (
            ("sample.png", sample_image("PNG"), "image/png", "image_url"),
            ("sample.pdf", sample_pdf(), "application/pdf", "file"),
        ):
            result = self.send(name, content, mime)
            self.assertEqual(result["status"], "completed", result)
            self.assertEqual(self.provider_payloads[-1]["messages"][-1]["content"][-1]["type"], part_type)

    def test_native_docx_uses_inline_gemini_data(self):
        self.provider, self.model_id, self.native_response = "gemini", "gemini-2.5-flash", True
        result = self.send("sample.docx", sample_docx(), SETTINGS["types"]["docx"])
        self.assertEqual(result["status"], "completed", result)
        payload = self.provider_payloads[-1]
        self.assertEqual(payload["input"][-1]["content"][-1]["type"], "document")
        self.assertFalse(payload["store"])

    def test_budget_and_false_file_type_do_not_reach_provider(self):
        self.provider, self.model_id = "openai", "unknown-text-model"
        result = self.send("large.txt", ("many separate words " * 6000).encode(), "text/plain")
        detail = result["error"]
        self.assertEqual(detail["code"], "context_limit")
        self.assertGreater(detail["used_tokens"], detail["limit_tokens"])
        self.assertTrue(detail["file_tokens"] and detail["fixes"])
        result = self.send("incorrect.pdf", b"ordinary text", "application/pdf")
        self.assertEqual(result["error"]["code"], "type_mismatch")
        self.assertFalse(self.provider_payloads)

    def test_combined_upload_cap_includes_every_file(self):
        fixture = sample_pdf()
        # A PDF comment adds bytes without changing page text or the token count.
        prefix, ending = fixture.rsplit(b"%%EOF", 1)

        def padded_pdf(size):
            padding = size - len(fixture) - 2
            return prefix + b"%" + b"x" * padding + b"\n%%EOF" + ending

        accepted = self.send("large.pdf", padded_pdf(4_089_446), "application/pdf")
        self.assertEqual(accepted["status"], "completed", accepted)
        request = {"request_id": str(uuid.uuid4()), "messages": [{"role": "user", "content": "Read this."}]}
        result = self.client.post(API + "/attachment-jobs",
                                  data={"request": json.dumps(request), "pages": '["",""]'},
                                  files=[("files", ("one.pdf", padded_pdf(2_000_000), "application/pdf")),
                                         ("files", ("two.pdf", padded_pdf(2_300_000), "application/pdf"))])
        self.assertEqual(result.status_code, 413, result.text)
        self.assertEqual(result.json()["detail"], SETTINGS["sizeLimitMessage"])
        self.assertEqual(len(self.provider_payloads), 1)

    def test_file_cache_isolates_bytes_and_plain_prompt(self):
        first = self.send("label.txt", b"First local test label", "text/plain")
        second = self.send("label.txt", b"Different local test label", "text/plain")
        repeat = self.send("label.txt", b"First local test label", "text/plain")
        for result in (first, second, repeat):
            self.assertEqual(result["status"], "completed", result)
        self.assertFalse(first["result"]["optiroute"]["cache_hit"])
        self.assertFalse(second["result"]["optiroute"]["cache_hit"])
        self.assertTrue(repeat["result"]["optiroute"]["cache_hit"])
        plain = self.client.post(API, json={"messages": [{"role": "user", "content": "Read the label."}]})
        self.assertEqual(plain.status_code, 200, plain.text)
        self.assertFalse(plain.json()["optiroute"]["cache_hit"])
        self.assertEqual(len(self.provider_payloads), 3)

    @unittest.skipUnless(FLAG == "false", "Run separately with TEST_UPLOAD_FLAG_OFF=true")
    def test_disabled_routes_and_text_cache(self):
        self.assertEqual(self.client.post(API + "/attachment-jobs").status_code, 404)
        self.assertEqual(self.client.get("/api/v1/file-capabilities").status_code, 404)
        prompt = {"messages": [{"role": "user", "content": "Read the label."}]}
        first = self.client.post(API, json=prompt)
        repeat = self.client.post(API, json=prompt)
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(repeat.status_code, 200, repeat.text)
        self.assertFalse(first.json()["optiroute"]["cache_hit"])
        self.assertTrue(repeat.json()["optiroute"]["cache_hit"])
        self.assertEqual(len(self.provider_payloads), 1)
