# Summit Sprint

A space-themed typing game: you run a trail on another world, and every correct keystroke carries you toward a black hole at the end. Type fast and accurately to cross the event horizon.

**Stack:** Django, Django REST Framework, SimpleJWT, React, TypeScript, Vite, Zustand, Axios

## Features

- JWT registration, login, and automatic token refresh
- Player profiles with best WPM, average accuracy, and races completed
- Three trails (Lunar Ridge, Belt Scramble, Olympus Mons Summit), five passages each, with difficulty and elevation
- Typing screen with live per-character feedback, a thin caret, and live WPM
- First-person canvas scene driven by typing progress, ending in a black hole finale
- Server-side scoring with anti-cheat checks, saved atomically with profile stats
- Global leaderboard, filterable by trail
- Permissions: authenticated players can race, only staff can edit tracks and passages, only a race's host can cancel it
- Toast notifications for API errors and an error boundary for UI crashes

## Where to find things

| Area                                                             | Location                                                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Models, relationships, validation                                | `backend/races/models.py`, `backend/accounts/models.py`                                       |
| N+1 avoidance (`select_related`, `prefetch_related`, `annotate`) | `backend/races/views.py`                                                                      |
| Serializers, viewsets, router                                    | `backend/races/serializers.py`, `views.py`, `urls.py`                                         |
| JWT auth and permissions                                         | `backend/accounts/`, `backend/races/permissions.py`, `REST_FRAMEWORK` in `config/settings.py` |
| Transactions and anti-cheat                                      | `RaceViewSet.submit` in `views.py`, `backend/races/scoring.py`, tests in `races/tests.py`     |
| TypeScript types (no `any`)                                      | `frontend/src/types/index.ts`                                                                 |
| Smart and presentational components                              | `frontend/src/pages/` (containers), `frontend/src/components/` (presentational)               |
| State management                                                 | `frontend/src/store/` (Zustand), `frontend/src/hooks/useTypingRace.ts`                        |
| API client, token refresh                                        | `frontend/src/api/client.ts`, `auth.ts`, `races.ts`                                           |
| Error handling                                                   | `frontend/src/components/ErrorBoundary.tsx`, `Toaster.tsx`, `src/api/client.ts`               |
| Canvas scene                                                     | `frontend/src/components/TrailCanvas.tsx`                                                     |

## Running it locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env       # macOS/Linux: cp .env.example .env, then set SECRET_KEY
python manage.py migrate
python manage.py seed_data
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env       # macOS/Linux: cp .env.example .env
npm run dev
```

Open http://localhost:5173 (the backend allows this origin through CORS).

### Environment variables

| File            | Variable               | Purpose                                       |
| --------------- | ---------------------- | --------------------------------------------- |
| `backend/.env`  | `SECRET_KEY`           | Django secret key                             |
| `backend/.env`  | `DEBUG`                | `True` for local development                  |
| `backend/.env`  | `ALLOWED_HOSTS`        | Comma-separated hosts                         |
| `backend/.env`  | `CORS_ALLOWED_ORIGINS` | Frontend origin, e.g. `http://localhost:5173` |
| `frontend/.env` | `VITE_API_URL`         | Backend API base URL                          |

### Tests

```bash
cd backend
python manage.py test races
```

## API overview

| Method    | Endpoint                  | Description                               |
| --------- | ------------------------- | ----------------------------------------- |
| POST      | `/api/auth/register/`     | Create an account                         |
| POST      | `/api/auth/login/`        | Get access and refresh tokens             |
| POST      | `/api/auth/refresh/`      | Refresh the access token                  |
| GET/PATCH | `/api/auth/me/`           | Current player's profile                  |
| GET       | `/api/tracks/`            | List tracks (staff can create and edit)   |
| GET       | `/api/passages/`          | List passages, filter by `track` or `tag` |
| GET/POST  | `/api/races/`             | List or create races                      |
| DELETE    | `/api/races/<id>/`        | Cancel a waiting race (host only)         |
| POST      | `/api/races/join/`        | Join a race by room code                  |
| POST      | `/api/races/<id>/submit/` | Submit a typed result for scoring         |
| GET       | `/api/leaderboard/`       | Top results, optional `track` filter      |

## Design notes

- Queries use `select_related` and `prefetch_related` to avoid N+1 problems, and `annotate` for per-track passage counts.
- Result submission runs in `transaction.atomic()` with row locks (`select_for_update`), so the score, race status, and profile stats update together or not at all.
- WPM and accuracy are computed on the server from the submitted text and elapsed time, and results above a human speed limit are rejected.
- The frontend has no `any` types. Pages fetch data and pass it to presentational components, network calls live in `src/api`, and shared state lives in Zustand stores.

## Future work

Live multiplayer races (Django Channels and Redis) with shared lobbies and real-time opponent progress are not implemented. The race and participant models, room codes, and the `join` endpoint are already in place to support them.
So I am currently working on this and that feature should be implemented by the deadline.
