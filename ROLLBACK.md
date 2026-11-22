# File upload rollback and preview

The baseline tag is `pre-file-upload-20261122` at
`707639c7e989cb045983ecea098788a919737ddc`. The review branch is
`feature/file-upload`. Production changes require explicit approval.

## Disable uploads

1. Set `FEATURE_FILE_UPLOAD=false` in the Render service environment and redeploy the backend. This removes the multipart jobs and capability routes.
2. Set `FEATURE_FILE_UPLOAD=false` in the Vercel project's corresponding environment and redeploy the frontend. Vite reads this flag when it builds the site, so changing the variable alone does not remove the picker.
3. For the isolated preview, turn off the flag on its Render service and set the Vercel Preview flag to `false` scoped to `feature/file-upload`. Redeploy both.
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

Review and merge the revert pull request, then confirm the production deployments built from the revert. Disable uploads before deploying the revert.

### Archive file-scoped records before a code revert

Flag-off mode keeps attachment answers isolated. Older versions of the cache can find file answers through their chat-history fallback, so reverting the code after real uploads requires archiving those records first. This step is unnecessary when reverting a deployment that never processed uploads. Back up the database and run this during a maintenance window with uploads disabled. Preserve the archive tables with the same access restrictions as the main database. The archived attachment turns will no longer appear in the older version's chat history.

```sql
BEGIN IMMEDIATE;
CREATE TABLE file_upload_rollback_chats AS
  SELECT * FROM chat_history WHERE context_hash LIKE 'files-v1:%';
CREATE TABLE file_upload_rollback_cache AS
  SELECT * FROM semantic_cache WHERE context_hash LIKE 'files-v1:%';
CREATE TABLE file_upload_rollback_attachment_parts AS
  SELECT * FROM chat_attachment_parts
  WHERE chat_id IN (SELECT chat_id FROM file_upload_rollback_chats);
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

## Isolated Render and Vercel preview

Use a separate **Free** web service linked to the `feature/file-upload` branch. Set the runtime to Docker, the Dockerfile path to `./Dockerfile.file-upload-preview`, and the health check to `/health`. Vercel hosts the frontend and rewrites its normal API calls under `/optiroute-api` to this separate Render service.

Set these variables on the preview service only:

| Variable | Value |
|---|---|
| `FEATURE_FILE_UPLOAD` | `true`; rebuild with `false` for the disabled test |
| `FIREBASE_PROJECT_ID` | The preview Firebase project ID |
| `CORS_ORIGINS` | Exact Vercel branch alias from `vercel.json` |
| `WORKFLOW_ENCRYPTION_KEY` | A new preview-only Fernet key. Generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` and enter it directly in Render. |

Vercel enables uploads for this branch's Preview build when `FEATURE_FILE_UPLOAD` is unset, using `VERCEL_ENV` and `VERCEL_GIT_COMMIT_REF`. An explicit `false` overrides it. Production and local builds default to off. Set the Firebase public web variables on Vercel if they are missing in Preview. Use the exact branch alias listed in `vercel.json`.

Use Firebase email/password for test sign-in. Google popups also require the preview host to be an authorized Firebase domain. Keep `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` unset. The preview uses local SQLite and can lose test chat history and model settings after a restart. Use synthetic attachments and preview-only provider keys.

The client and Render count combined file bytes. The limit is 4 MB (4,194,304 bytes) shared by up to three files, with a separate allowance for bounded multipart framing. A PDF range reduces processing but does not shrink the bytes sent by the browser. Export that range to a smaller PDF to reduce the upload size.

## Production rollout after approval

The preview and production URLs have separate Vercel rewrites. A session on the production URL will continue to use the existing Turso data because the rewrites for the production hosts point to the existing production Render service.

1. In Turso, verify that a backup or restore point is available for the existing production database. Record a baseline using an existing production account. Check its chat history, model connections, and cache without deleting or changing records. Keep the existing Firebase project and user identity.
2. Keep the existing production Render service, branch, and environment. Preserve the exact `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `WORKFLOW_ENCRYPTION_KEY`, and `FIREBASE_PROJECT_ID`. The encryption key is required to read existing model keys. Keep `REQUIRE_REMOTE_DATABASE=true`. Do not copy the preview environment into production.
3. After the approved squash merge, keep the feature flag off while switching the existing production service to the Docker runtime. Use `./Dockerfile.file-upload-preview` for the image and override the **Docker Command** with:

   ```sh
   sh -c 'uvicorn optiroute.file_upload_production:app --host 0.0.0.0 --port "${PORT:-10000}"'
   ```

   The production entry point requires the Turso credentials and encryption key. It will fail startup rather than fall back to an empty local database. The image supplies OCR and the tokenizer. Verify the production logs report Turso, the original account has the same chats and model connections, and a normal text prompt succeeds with an existing saved key.
4. Enable uploads on production Render first, then set the flag for the **Production** environment in Vercel and rebuild. Verify the existing account again and test an attachment through the production rewrite. Disable uploads using the steps at the top of this file if verification fails.

Startup adds a table for encrypted attachment parts and preserves existing accounts, chats, model connections, and cache entries. The model capability registry is read from configuration. Preview SQLite data is separate.

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
- A successful attachment turn saves the encrypted original files with the chat in Turso. Cache entries link to the same owned chat and do not store another copy. Follow-ups and heavier retries can reopen the saved files. Deleting the chat removes its attachments through the database's foreign key. Keep the existing encryption key to retain access.
- OptiRoute closes upload temp files and keeps extracted text in the running request only. Answers can quote attached material. Provider retention follows the provider's own settings.
- The limiter allows four admitted requests per account per minute and one attachment job at a time per instance. It resets on restart.
