# MIRA Backend

FastAPI + SQLite backend for **MIRA: An AI-Powered Smart Mirror for
Personalized Beauty and Wellness Assistance Using Computer Vision**.

Built specifically around the existing MIRA React frontend (Dashboard, Skin
Analysis, Wellness, Skincare Routine, Insights, Settings) — response shapes
match `src/data/mockData.js` and `src/services/mira.js` exactly so the UI
needs no rework.

```
React Frontend  →  FastAPI REST API  →  Service Layer  →  CV/ML  →  SQLite
```

## ⚠️ About this build

This project was generated in a sandboxed environment without a Python
runtime, so the backend could not be `pip install`-ed, migrated, or booted
here. Every file has been written by hand but **you'll need to run the steps
below on your own machine** to install dependencies, run migrations, seed
data, start the server, and run `pytest`.

**Database:** defaults to a local **SQLite** file (`backend/mira.db`) — no
server, no Docker, no account, fully offline. PostgreSQL is still fully
supported: set a `postgresql+psycopg2://...` `DATABASE_URL` in `.env`
(and `docker compose up -d db` if you want a local container).

---

## A. Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, error handlers, routers
│   ├── core/                    # config, database session, logging
│   ├── models/                  # SQLAlchemy ORM models
│   ├── schemas/                 # Pydantic request/response models
│   ├── api/routes/              # one router per frontend concern
│   ├── services/                # business logic, DB persistence
│   ├── cv/                      # OpenCV/MediaPipe wrappers (face, hands, skin)
│   ├── ml/                      # inference abstraction + preprocessing
│   └── utils/                   # error handling, helpers
├── alembic/                     # migrations (0001_initial_schema.py)
├── tests/                       # pytest suite, SQLite in-memory, mock CV
├── seed.py                      # DEV seed data script
├── requirements.txt
├── .env.example
├── docker-compose.yml           # PostgreSQL (+ optional backend container)
└── Dockerfile
```

## B. Setup Commands

```bash
# 1. Create + activate a virtualenv
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env file (defaults to SQLite — no other setup needed)
cp .env.example .env
```

## C. Environment Variables (`.env`)

```
DATABASE_URL=sqlite:///./mira.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
APP_ENV=development
LOG_LEVEL=INFO
API_V1_PREFIX=/api/v1
```

## D. Database Setup

**Default (SQLite):** nothing to do — the FastAPI app creates missing
tables automatically at startup. `alembic upgrade head` is still available
if you prefer explicit migrations. Delete `backend/mira.db` to start over.

**PostgreSQL (optional):** set `DATABASE_URL` to a
`postgresql+psycopg2://user:pass@host/db` string. For a local container,
`docker compose up -d db` starts one (user `mira_user`, db `mira_db`,
password `mira_password` — change these before any real deployment). For a
free cloud DB (Neon/Supabase), keep the `?sslmode=require` they provide.

## E. Migration Commands

```bash
alembic upgrade head        # creates all 8 tables
alembic downgrade base      # drops them (dev only)
```

## F. Backend Startup

```bash
uvicorn app.main:app --reload
# → http://localhost:8000
```

Seed demo data (optional, dev only):

```bash
python seed.py
```

## G. Frontend Startup

```bash
cd ../frontend
cp .env.example .env        # sets VITE_API_BASE_URL=http://localhost:8000/api/v1
npm install
npm run dev
# → http://localhost:5173
```

## H. API Endpoint List

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | service + DB health |
| POST | `/api/v1/auth/register` | create account/profile and session |
| POST | `/api/v1/auth/login` | login and return session |
| POST | `/api/v1/auth/users` | create local profile |
| GET | `/api/v1/auth/users` | list local profiles |
| GET | `/api/v1/auth/users/{user_id}` | get profile |
| POST | `/api/v1/skin-analysis/analyze` | run CV pipeline on optional frame, persist scores |
| GET | `/api/v1/skin-analysis/latest` | latest skin analysis |
| GET | `/api/v1/skin-analysis/history/me` | authenticated user's paginated history |
| GET | `/api/v1/expression/latest` | latest expression estimate |
| POST | `/api/v1/expression/estimate` | run a new expression estimate |
| GET | `/api/v1/hand-tracking/status` | hand-tracking pipeline status |
| GET | `/api/v1/recommendations` | current non-medical recommendations |
| PATCH | `/api/v1/recommendations/{id}/add-to-routine` | mark added to routine |
| GET | `/api/v1/routine` | today's routine + steps |
| GET | `/api/v1/routine/progress` | completion percentage |
| PATCH | `/api/v1/routine/steps/{step_id}/complete` | toggle a step (step_id = 1..N) |
| GET | `/api/v1/routine/history` | task-level routine completion history |
| POST | `/api/v1/routine/reset` | reset today's routine |
| GET | `/api/v1/wellness/insights?days=7` | trend + completion chart data |
| GET | `/api/v1/privacy/status` | privacy configuration |

Full interactive docs: `http://localhost:8000/docs` (Swagger) and `/redoc`.

## I. Database Schema

9 tables, minimal PII, **no images/embeddings ever stored**:

- `users` — id, display_name, optional age, account fields, timestamps
- `skin_analysis` — visible-feature scores (0–100), fatigue, recommendation summary, processing metadata
- `facial_expression_analysis` — expression + confidence
- `recommendations` — rule-generated, linked to an analysis
- `skincare_routines` / `routine_steps` — today's routine + step state
- `routine_progress` — daily completion snapshot (feeds wellness trends)
- `routine_task_progress` — per-task routine completion history
- `wellness_insights` — daily consistency/brightness rollups

Indexes on `user_id`, `timestamp`/`*_date`, and `analysis_id` for query
performance.

## J. Frontend ↔ Backend Communication

`src/services/mira.js` now calls a small `apiClient` that hits
`VITE_API_BASE_URL` (defaults to `http://localhost:8000/api/v1`). Every
exported function keeps its original name and return shape, so no component
(`SkinAnalysis.jsx`, `RoutineTracker.jsx`, etc.) needed to change — except
`RoutineTracker.jsx`, which now also calls `completeRoutineStep(id)` so
toggling a step persists to the backend instead of only updating local
state.

## K. Connecting Real CV/ML Later

- `app/cv/skin_analyzer.py`: replace `HeuristicSkinAnalyzer` with an
  `MLSkinAnalyzer` implementing the same `SkinAnalyzer.analyze()` interface.
- `app/services/expression_service.py`: swap the random demo choice for a
  MediaPipe-landmark or CNN-based classifier behind `estimate_expression()`.
- `app/cv/hand_tracker.py` already wraps real MediaPipe Hands when installed
  — extend `hand_tracking_service.py` with a WebSocket route for live
  per-frame gesture streaming when you're ready to move off polling.
- Drop trained model weights under `app/ml/models/` and load them inside
  `app/ml/inference.py`'s `get_skin_analyzer()`.

## L. Testing

```bash
pytest -v
```

All tests use an in-memory SQLite DB and mock/demo CV inference — no
PostgreSQL or webcam required.

## M. Troubleshooting

| Symptom | Fix |
|---|---|
| `no such table` / `relation "skin_analysis" does not exist` | run `alembic upgrade head` |
| `could not connect to server` (PostgreSQL only) | `docker compose up -d db`, check `DATABASE_URL` |
| want a clean database | delete `backend/mira.db`, re-run `alembic upgrade head` + `python seed.py` |
| CORS errors in browser console | confirm `CORS_ORIGINS` in `.env` includes `http://localhost:5173` |
| `ModuleNotFoundError: mediapipe` | `pip install -r requirements.txt`; the app still runs using demo/heuristic analyzers if mediapipe/opencv aren't available |
| Frontend shows "backend unavailable" | confirm `uvicorn` is running on port 8000 and `VITE_API_BASE_URL` matches |
| 422 on `/skin-analysis/analyze` | uploaded frame is corrupt/unreadable; the endpoint falls back gracefully only when no file is sent at all |

## Privacy & Medical Disclaimer

MIRA performs **visible feature analysis only** — it is not a medical
diagnostic system. No facial images, webcam frames, or biometric embeddings
are ever written to disk or the database; only derived numeric scores are
persisted. See `GET /api/v1/privacy/status`.

## Product recommendations and personalized routine

MIRA uses [Open Beauty Facts](https://world.openbeautyfacts.org/) as a source
of cosmetic product information. **Open Beauty Facts provides cosmetic product
information. MIRA's recommendation engine maps existing visible-skin-feature
analysis to relevant cosmetic categories.** The engine uses MIRA's stored
0–100 visible-feature levels—not external services—to choose a small set of
search terms. For example, higher visible acne-like spots can look for
blemish-care products, visible redness can look for gentle products, and sun
protection is always offered. This is cosmetic guidance, not a diagnosis.

Open Beauty Facts is called only by the FastAPI backend and receives only
product search text (never frames, images, videos, biometric data, or analysis
payloads). Requests time out after six seconds and return a friendly temporary
unavailability message rather than breaking MIRA. Product fields are optional;
the UI shows a clean no-image/no-data state where needed.

External categories are normalized to MIRA categories and routine positions:
cleanser → Cleanse; toner, essence, and hydrating serum → Hydrate; treatment,
acne/spot treatment, mask, and eye cream → Treatment; moisturizer/face cream →
Moisturize; sunscreen → Sun Protection. Treatment is inserted into the
existing routine only while a current-user treatment product exists, so its
normal preparation gap, timer, and gesture controls automatically apply.

Selected products are stored in `user_products` with only remote product
metadata (including an optional image URL), keyed to the authenticated session
user. `(user_id, product_id)` is unique, preventing duplicates and preventing
one user from seeing another user's routine entries. The external product is
never changed when a local entry is removed.

New endpoints (all require the existing bearer session):

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/products/recommendations` | Personalized and additional products after analysis |
| GET | `/api/v1/products/search?query=` | Search Open Beauty Facts cosmetics |
| GET | `/api/v1/products/routine` | Current user's saved products |
| POST | `/api/v1/products/routine` | Add a product to the correct routine step |
| DELETE | `/api/v1/products/routine/{id}` | Remove that user's routine entry |

Run `alembic upgrade head` to apply the `user_products` migration, then run
`pytest -v` and `npm run build` (from `frontend`) to verify the feature.
Open Beauty Facts data is community-maintained and can be incomplete; MIRA does
not invent prices, ratings, availability, ingredients, images, or claims.
