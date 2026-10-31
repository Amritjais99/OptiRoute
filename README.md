# OptiRoute

React/Vite frontend and FastAPI backend for user-owned AI model routing.

## Free hosting

- Frontend: Vercel, Node.js 22, `npm ci`, `npm run build`, output `dist`.
- API: Render Free, Python 3.12, build `pip install -r backend/requirements.txt && cd backend && python prepare_embeddings.py`, start `cd backend && uvicorn optiroute.main:app --host 0.0.0.0 --port $PORT`.
- Storage: an external Turso **libSQL** database, configured through `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. No production data is kept in Render's temporary filesystem.
- Embeddings: the MiniLM model runs through FastEmbed/ONNX to avoid the PyTorch dependency. Set `EMBEDDING_CACHE_DIR` to a directory included in the Render build artifacts, such as `/opt/render/project/src/backend/.embeddings`.

Set API variables `FIREBASE_PROJECT_ID`, a stable Fernet `WORKFLOW_ENCRYPTION_KEY`, `REQUIRE_REMOTE_DATABASE=true`, and `CORS_ORIGINS` to the exact frontend origin. Configure Vercel's `VITE_*` values from `.env.example`, using the live API URL. Add the frontend domain to Firebase Authentication's authorized domains.

Hosting is subject to free-plan quotas. Render sleeps after inactivity and shares its monthly free hours with other free services in the workspace. AI provider usage depends on each connected provider's separate allowance.

Run `cd backend && python test_deployment.py` for disposable database adapter and API startup checks. These checks use a local file and do not replace a live Turso persistence check.

The original deployment guide and historical reports describe the supplied archive. This README describes the free-hosting adaptations.
