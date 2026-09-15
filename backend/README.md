# MIRA Backend

FastAPI + PostgreSQL backend for **MIRA: An AI-Powered Smart Mirror for
Personalized Beauty and Wellness Assistance Using Computer Vision**.

Built specifically around the existing MIRA React frontend (Dashboard, Skin
Analysis, Wellness, Skincare Routine, Insights, Settings) — response shapes
match `src/data/mockData.js` and `src/services/mira.js` exactly so the UI
needs no rework.

```
React Frontend  →  FastAPI REST API  →  Service Layer  →  CV/ML  →  PostgreSQL
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

**Default (SQLite):** nothing to do — `alembic upgrade head` creates
`backend/mira.db`. Delete that file to start over.

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
| POST | `/api/v1/skin-analysis/analyze` | run CV pipeline on optional frame, persist scores |
| GET | `/api/v1/skin-analysis/latest` | latest skin analysis |
| GET | `/api/v1/skin-analysis/history` | paginated history |
| GET | `/api/v1/expression/latest` | latest expression estimate |
| POST | `/api/v1/expression/estimate` | run a new expression estimate |
| GET | `/api/v1/hand-tracking/status` | hand-tracking pipeline status |
| GET | `/api/v1/recommendations` | current non-medical recommendations |
| PATCH | `/api/v1/recommendations/{id}/add-to-routine` | mark added to routine |
| GET | `/api/v1/routine` | today's routine + steps |
| GET | `/api/v1/routine/progress` | completion percentage |
| PATCH | `/api/v1/routine/steps/{step_id}/complete` | toggle a step (step_id = 1..N) |
| POST | `/api/v1/routine/reset` | reset today's routine |
| GET | `/api/v1/wellness/insights?days=7` | trend + completion chart data |
| GET | `/api/v1/privacy/status` | privacy configuration |

Full interactive docs: `http://localhost:8000/docs` (Swagger) and `/redoc`.

## I. Database Schema

8 tables, minimal PII, **no images/embeddings ever stored**:

- `users` — id, display_name, timestamps
- `skin_analysis` — 6 visible-feature scores (0–100) + processing metadata
- `facial_expression_analysis` — expression + confidence
- `recommendations` — rule-generated, linked to an analysis
- `skincare_routines` / `routine_steps` — today's routine + step state
- `routine_progress` — daily completion snapshot (feeds wellness trends)
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
