# Summit Sprint

A space-themed typing game where you hike across other worlds. Each trail is a typing passage: the faster and more accurately you type, the higher your astronaut climbs toward the summit flag.

**Stack:** Django, Django REST Framework, SimpleJWT, React, TypeScript, Vite, Zustand, Axios

## Features

- JWT registration, login, and automatic token refresh
- Player profiles with best WPM, average accuracy, and races completed
- Space-themed tracks (Lunar Ridge, Belt Scramble, Olympus Mons Summit) with difficulty and elevation
- Typing screen with per-character feedback, live WPM, and a climbing astronaut
- Server-side scoring with anti-cheat checks, saved atomically with profile stats
- Global leaderboard
- Role-based permissions: any player can read and race, only staff can edit tracks and passages
- Toast notifications for API errors and an error boundary for UI crashes

## Project structure

```
backend/    Django project (accounts, races, config)
frontend/   React + TypeScript app (Vite)
```

## Running it locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       
pip install -r requirements.txt
cp .env.example .env         
python manage.py migrate
python manage.py seed_data
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env         
npm run dev
```

Open http://localhost:5173 (the backend allows this origin through CORS).

### Environment variables

| File | Variable | Purpose |
|------|----------|---------|
| `backend/.env` | `SECRET_KEY` | Django secret key |
| `backend/.env` | `DEBUG` | `True` for local development |
| `backend/.env` | `ALLOWED_HOSTS` | Comma-separated hosts |
| `backend/.env` | `CORS_ALLOWED_ORIGINS` | Frontend origin, e.g. `http://localhost:5173` |
| `frontend/.env` | `VITE_API_URL` | Backend API base URL |

### Tests

```bash
cd backend
python manage.py test races
```

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Create an account |
| POST | `/api/auth/login/` | Get access and refresh tokens |
| POST | `/api/auth/refresh/` | Refresh the access token |
| GET/PATCH | `/api/auth/me/` | Current player's profile |
| GET | `/api/tracks/` | List tracks (staff can create and edit) |
| GET | `/api/passages/` | List passages, filter by `track` or `tag` |
| POST | `/api/races/` | Create a race |
| POST | `/api/races/join/` | Join a race by room code |
| POST | `/api/races/<id>/submit/` | Submit a typed result for scoring |
| GET | `/api/leaderboard/` | Top results, optional `track` filter |

## Design notes

- Queries use `select_related` and `prefetch_related` to avoid N+1 problems, and `annotate` for per-track passage counts.
- Result submission runs in `transaction.atomic()` with row locks (`select_for_update`) so scores, race status, and profile stats update together or not at all.
- WPM and accuracy are computed on the server from the submitted text and elapsed time. Results above a human speed limit are rejected.
- The frontend has no `any` types. Smart container pages fetch data and pass it to presentational components. Network calls live in `src/api`, and shared state lives in Zustand stores.

## Future work

Live multiplayer races (Django Channels and Redis) with shared lobbies and real-time progress bars are not implemented yet. The race and participant models, room codes, and `join` endpoint are already in place to support them.