# OptiRoute deployment guide

This archive contains the current frontend and backend source, dependency manifests, Firebase web configuration template, and a current project report. It intentionally starts with an empty SQLite database.

## Files to deploy

- Frontend: `src/`, `public/`, `index.html`, `package.json`, `package-lock.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`.
- Backend: `backend/optiroute/`, `backend/config.yaml`, `backend/requirements.txt`.
- Templates: `.env.example` for the Vite build, `backend/.env.example` for the API process.
- Documentation: this guide and `PROJECT_REPORT_CURRENT.md`. The old cyclomatic complexity report is historical and is included in `historical-report/` for comparison.

## Prerequisites

- Node.js 20.19+ or 22.12+ and npm for the Vite build.
- Python 3.11+ for the backend.
- Public HTTPS addresses for the frontend and API.
- A Firebase project with Email/Password and Google authentication enabled.
- A persistent, writable volume for `backend/data/`.
- A model provider API key for each user who needs to generate answers. Provider keys are entered through the application and encrypted in the database.

## Configure the frontend

Copy `.env.example` to `.env.production` before building. The included Firebase values are web client configuration for the existing project; they are not backend secrets. Set `VITE_API_BASE_URL` to the **public HTTPS backend origin**, without a trailing slash. Do not use `localhost` or `127.0.0.1` for a public build. The browser uses this variable, so it must be correct at build time.

Add the deployed frontend domain to Firebase Authentication's authorized domains. Confirm the Firebase project has the intended sign in methods enabled. If using a different Firebase project, replace all four `VITE_FIREBASE_*` values and set the matching backend project ID.

```bash
npm ci
npm run build
```

Publish the resulting `dist/` directory on a static HTTPS host. Configure the host to serve `index.html` for unknown frontend paths, so direct visits to `/login`, `/prompt`, and `/dashboard/*` work.

## Configure the backend

Copy `backend/.env.example` to `backend/.env`. Set `FIREBASE_PROJECT_ID` to the Firebase project used by the frontend. Generate a Fernet key and set `WORKFLOW_ENCRYPTION_KEY` to it. Keep that exact key in the deployment secret store across restarts; changing it makes saved provider keys unreadable.

```bash
cd backend
python -m venv .venv
# Activate the venv for your operating system, then:
python -m pip install -r requirements.txt
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
python -m uvicorn optiroute.main:app --host 0.0.0.0 --port 8000
```

Run that command from the `backend/` directory. Expose the API through HTTPS on your chosen platform and point the frontend's `VITE_API_BASE_URL` at it. Persist `backend/data/` on a volume. Without that volume, redeploys can erase chats, cache entries, and encrypted model connections. Do not mount a read only filesystem at that path.

The backend can verify Firebase ID tokens using Firebase public keys with its current anonymous credentials path. It also accepts a private `backend/firebase-adminsdk.json` service account file if one is required in your environment. The file is not included in this archive; keep it in a secret store and do not publish it.

## Deployment checks

1. Open the backend `/health` endpoint over HTTPS.
2. Open the frontend home page and directly open `/login` to confirm the SPA fallback.
3. Sign in and load the Overview page; this checks Firebase token verification and frontend API URL configuration.
4. Connect a provider model and run a short prompt; inspect the response, chat history, and cache page.
5. Delete a test chat and verify the linked cache entry is gone.
6. Restart the backend and confirm the test chat and model connection still exist. This checks persistence and the stable encryption key.

If Google sign in reports an unauthorized domain, fix the Firebase Authentication authorized domains. If the frontend tries `127.0.0.1:8000`, rebuild it with the correct `VITE_API_BASE_URL`. If saved provider keys cannot be decrypted after restart, restore the original `WORKFLOW_ENCRYPTION_KEY`.

## Security and limits

The source currently allows any CORS origin, so restrict `allow_origins` in `backend/optiroute/main.py` to the deployed frontend origin before a public production launch. Provider access, request volume, and available models depend on each provider account. The source report does not assert that every listed provider was tested with a live key.
