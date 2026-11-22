# File upload rollback and preview

The baseline tag is `pre-file-upload-20261122` at
`707639c7e989cb045983ecea098788a919737ddc`. The review branch is
`feature/file-upload`. Production changes require explicit approval.

## Disable uploads

1. Set `FEATURE_FILE_UPLOAD=false` in the Render service environment and redeploy the backend. This removes the multipart jobs and capability routes.
2. Set `FEATURE_FILE_UPLOAD=false` in the Vercel project's corresponding environment and redeploy the frontend. Vite reads this flag when it builds the site, so changing the variable alone does not remove the picker.
3. For the standalone Docker preview, set the flag to `false` and select **Save, rebuild, and deploy**. Both layers use this service's environment.
4. Verify that the prompt composer has no attachment button, the attachment jobs route is unavailable, and existing text chat works.

## Revert the feature after an approved squash merge

Find the single `feat: file upload (OCR/native)` commit on `main`. Verify its SHA in the output below and use it as `FEATURE_COMMIT_SHA`. If uploads were enabled, archive the file-scoped records using the procedure below before reverting.

```sh
git fetch origin --tags
git log origin/main --oneline --grep='^feat: file upload (OCR/native)$'
git switch -c revert/file-upload origin/main
git revert FEATURE_COMMIT_SHA
git push -u origin revert/file-upload
gh pr create --base main --head revert/file-upload --title "Revert file upload" --body "Restore the pre-upload code path."
```

Review and merge the revert pull request, then confirm the production deployments built from the revert. The capability override table can remain in place. Disable uploads before deploying the revert.

### Archive file-scoped records before a code revert

Flag-off mode keeps attachment answers isolated. Older versions of the cache can find file answers through their chat-history fallback, so reverting the code after real uploads requires archiving those records first. This step is unnecessary when reverting a deployment that never processed uploads. Back up the database and run this during a maintenance window with uploads disabled. Preserve the archive tables with the same access restrictions as the main database. The archived attachment turns will no longer appear in the older version's chat history.

```sql
BEGIN IMMEDIATE;
CREATE TABLE file_upload_rollback_chats AS
  SELECT * FROM chat_history WHERE context_hash LIKE 'files-v1:%';
CREATE TABLE file_upload_rollback_cache AS
  SELECT * FROM semantic_cache WHERE context_hash LIKE 'files-v1:%';
CREATE TABLE file_upload_rollback_cache_links AS
  SELECT log_id, cache_id FROM audit_logs
  WHERE cache_id IN (SELECT cache_id FROM file_upload_rollback_cache);
UPDATE audit_logs SET cache_id = NULL
  WHERE log_id IN (SELECT log_id FROM file_upload_rollback_cache_links);
DELETE FROM semantic_cache WHERE cache_id IN (SELECT cache_id FROM file_upload_rollback_cache);
DELETE FROM chat_history WHERE chat_id IN (SELECT chat_id FROM file_upload_rollback_chats);
COMMIT;
```

If a later turn refers to an archived attachment answer, forked chat history may be incomplete on the older version. Use the feature flag when preserving accessible conversations is a priority. Restore archived data only with an attachment-aware version running and after checking for conflicts with newer records.

## Standalone Render preview

Use a separate **Free** web service linked to the `feature/file-upload` branch. Set the runtime to Docker, the Dockerfile path to `./Dockerfile.file-upload-preview`, and the health check to `/health`. The image builds the frontend and hosts it with the preview API from one HTTPS origin.

Set these variables on the preview service only:

| Variable | Value |
|---|---|
| `FEATURE_FILE_UPLOAD` | `true`; rebuild with `false` for the disabled test |
| `FIREBASE_PROJECT_ID` | The preview Firebase project ID |
| `VITE_FIREBASE_PROJECT_ID` | Same preview Firebase project ID |
| `VITE_FIREBASE_API_KEY` | Public web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Public web app auth domain |
| `VITE_FIREBASE_APP_ID` | Public web app ID |
| `WORKFLOW_ENCRYPTION_KEY` | A new preview-only Fernet key. Generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` and enter it directly in Render. |

Use Firebase email/password for test sign-in. Google popups also require the preview host to be listed as an authorized domain. Keep the preview isolated by leaving `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` unset. The preview uses local SQLite and can lose test chat history and model settings after a restart. Use synthetic attachments and test credentials from the model providers.

The browser sends multipart requests directly to the Render backend. Vercel's default Function request limit is 4.5 MB, below both the 10 MB per-file limit and the roughly 30 MB maximum multipart body. If a hosting proxy cannot accept the largest requests, a direct signed upload to private object storage with short expiration and immediate cleanup is an alternative. This branch does not provision storage.

Production, if separately approved, needs the backend runtime to install `backend/requirements-file-upload.txt`, install Tesseract and its English language data, and prefetch the `o200k_base` tokenizer into `TIKTOKEN_CACHE_DIR`. The preview Docker image supplies these. The existing production Python start command does not install them.

## Test commands and limits

```sh
# Run from the repository root, with the backend dependencies and Tesseract installed.
python -c "import tiktoken; tiktoken.get_encoding('o200k_base')"
cd backend
python -m unittest -v test_file_upload
python test_deployment.py
# POSIX shell
TEST_UPLOAD_FLAG_OFF=true python -m unittest -v test_file_upload.UploadFlow.test_disabled_routes_and_text_cache
```

- Report token counts as estimates. Native image and PDF processing can vary by provider. Check each provider's own payload, context, and account limits in the hosted preview.
- OCR uses English and is limited to 20 scanned pages per file. PDF page selections are limited to 100 pages. Low confidence and unreadable pages are reported. Image OCR extracts text and cannot describe a purely visual scene.
- OptiRoute closes upload temp files and keeps extracted text in the running request only. Answers are still stored in chat history and eligible cache entries and can quote attached material. Provider retention follows the provider's own settings.
- The limiter allows four admitted requests per account per minute and one attachment job at a time per instance. It resets on restart.
