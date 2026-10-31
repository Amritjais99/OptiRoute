# OptiRoute current project report

**Verified against the source tree on 31 October 2026.** This report describes the current application for the deployer and for updating the college project report. It is a source review, not a claim that production deployment or all end to end flows have been tested.

## Project overview

OptiRoute is a web application that routes a signed in user's prompt to a model they have connected in a light, mid, or heavy workload tier. It saves chats, reuses eligible answers from a user scoped semantic cache, and shows request and cache metrics. Users can ask a heavier tier to answer an earlier prompt and choose which answer should be used for future cache hits.

## Current architecture

| Layer | Current implementation | Source |
| --- | --- | --- |
| Web app | React 19, Vite 8, React Router, Tailwind CSS | `package.json`, `src/App.jsx` |
| API | Python 3.11+, FastAPI, Uvicorn | `backend/requirements.txt`, `backend/optiroute/main.py` |
| Authentication | Firebase Authentication for email/password and Google; backend verifies Firebase ID tokens | `src/utils/firebase.js`, `backend/optiroute/auth.py` |
| Persistence | SQLite with async access through aiosqlite | `backend/optiroute/database.py` |
| Provider access | User supplied API keys encrypted with Fernet; provider models organized by tier | `backend/optiroute/connections.py` |
| Routing | Workload evaluation, model ranking, tier selection, fallback and continuation | `backend/optiroute/engine/`, `backend/optiroute/main.py`, `backend/optiroute/proxy.py` |
| Cache | Exact and semantic prompt matching scoped to the user, with deletion exclusions | `backend/optiroute/engine/cache_manager.py`, `backend/optiroute/database.py` |
| Response display | Markdown, GitHub style tables, and KaTeX mathematics | `src/components/ui/MarkdownRenderer.jsx` |

## Main user functions

1. Create an account or sign in with email/password or Google.
2. Connect provider models to light, mid, and heavy workflows using a provider API key.
3. Enter prompts in the Playground; routing selects a tier and a connected model.
4. Follow generation progress, provider failures, retry attempts, and the final answer.
5. Ask a heavier model to answer a prior prompt in the same conversation. The new answer is shown alongside the earlier answer; later chat turns can continue from the selected answer.
6. Choose an answer for the cache. Cache entries can be searched and deleted. Deleting a linked chat or cache entry also removes its linked records.
7. View total requests, cache hit rate, requests per model, and weekly requests by tier on the Overview page.

The deployed frontend has routes for Home, Login, Signup, Playground, Overview, Routing Policies, and Semantic Cache. `/dashboard/budget` redirects to Overview; it is not a separate current dashboard page.

## Current API and data

The active API is `backend/optiroute/main.py`. It includes chat completion and retry jobs, progress polling and cancellation, model connection management, cache listing/deletion, chat history/detail/deletion, dashboard data, and a health endpoint. The database schema also includes model connections, semantic cache, cache exclusions, audit logs, failed model requests, and chat history. The backend creates `backend/data/optiroute.db` on startup when the data directory is writable.

Current source constants set **90 seconds per model attempt** and **180 seconds for the complete prompt**. These are application limits and should not be described as provider imposed limits. Provider limits can be lower.

## Verification against the earlier report

The existing `Cyclomatic_Complexity_Analysis_OptiRoute.docx` and PDF are dated 13 October 2026. They describe an older code snapshot. Their method is still useful as a historical software engineering artifact, but their module totals and complexity scores are **not verified for this version**. Recalculate complexity from the current files before quoting those numbers as current results.

| Earlier documentation claim | Current source finding |
| --- | --- |
| Only the older core modules are analyzed | Current backend also includes `auth.py`, `auth_routes.py`, `connections.py`, `inflight.py`, and newer engine modules such as `model_ranking.py` and `workload.py`. |
| Chat is a direct request/response only | Current API supports asynchronous jobs, progress/status polling, cancellation, heavier retry, and answer selection. |
| A dashboard Budget page is available | Current router redirects `/dashboard/budget` to Overview. |
| Cache and chat are independent records | Current deletion logic links user cache entries and chat conversations. |
| Provider calls are only Groq based | Current connection code supports Groq, OpenAI, OpenRouter, Together, Fireworks, Mistral, DeepSeek, Gemini, and Anthropic endpoints. A user's actual access depends on their provider account and key. |

## Deployment requirements and limits

The frontend needs a public HTTPS API URL and Firebase web configuration at build time. The backend needs `FIREBASE_PROJECT_ID`, a stable `WORKFLOW_ENCRYPTION_KEY`, and persistent writable storage for `backend/data/optiroute.db`. The Firebase project must enable the intended sign in providers and authorize the deployed frontend domain. Users must add their own accessible provider models and API keys before generation works.

Do not ship the developer's local `.env`, SQLite database, API keys, or service account file in a distribution. The deployment ZIP contains templates and the exact source needed to build the frontend and run the backend. A public deployment still needs the deployer's HTTPS host names, Firebase authorized domain setup, and persistent storage configuration.
