# Summit Sprint

A space-themed typing game. You run a winding trail on another world, and every correct keystroke carries you closer to a black hole at the end of the path. Cross the event horizon to finish. Race solo, or host a crew race and compete live against friends.

**Stack:** Django, Django REST Framework, SimpleJWT, Django Channels (Daphne), React, TypeScript, Vite, Zustand, Axios

## Features

**Gameplay**

- First-person helmet view drawn on a canvas: a winding trail, floating rocks and crystals, speed lines, and a black hole that grows as you type, followed by a multi-stage finale (the world collapses into the hole, a wormhole tunnel, a flash, and a new galaxy)
- Typing screen with live feedback: dim text ahead of you, bright text for correct characters, red underlines for mistakes, and a thin amber caret that follows along
- Three trails (Lunar Ridge, Belt Scramble, Olympus Mons Summit) with 15 passages in total, each with a difficulty and an elevation
- Crew races: host a room, share a 6-character code, and race friends with a live lobby, a 3-2-1-GO countdown, live opponent progress lines, and a winner announcement with full standings
- Global leaderboard, filterable by trail

**Accounts and fair play**

- JWT registration, login, and automatic token refresh
- Player profiles with best WPM, average accuracy, and races completed
- Anti-spam typing rules: you cannot type more than one character past a mistake, progress counts only correct characters, and a race finishes only on an exact match of the passage
- Server-side scoring: the backend recomputes WPM and accuracy, requires an exact match, and rejects humanly impossible speeds

**Engineering**

- Role-based permissions: authenticated players can race, only staff can edit tracks and passages, only a race's host can cancel it
- Toast notifications for API errors and an error boundary for UI crashes
- Strict TypeScript (no `any`), with pages that fetch data and presentational components that render it

## Where to find things

| Rubric area                                                                                          | Location                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Django models and database**: one-to-one, foreign key, many-to-many, migrations, validation        | `backend/accounts/models.py` (`Profile`), `backend/races/models.py` (`Track`, `Passage`, `PassageTag`, `Race`, `RaceParticipant`)                     |
| **Query efficiency**: `select_related`, `prefetch_related`, `annotate`                               | `backend/races/views.py` (`TrackViewSet`, `PassageViewSet`, `RaceViewSet`, `LeaderboardView`)                                                         |
| **API design**: serializers, viewsets, router                                                        | `backend/races/serializers.py`, `views.py`, `urls.py`, `backend/accounts/`                                                                            |
| **Authentication and permissions**: JWT, `IsAuthenticated`, role-based guards                        | `backend/accounts/`, `backend/races/permissions.py`, `REST_FRAMEWORK` in `backend/config/settings.py`, `backend/races/ws_auth.py` (JWT on the socket) |
| **Transactions and backend error handling**: `transaction.atomic()`, `select_for_update`, try/except | `RaceViewSet.submit` and `perform_create` in `backend/races/views.py`                                                                                 |
| **Scoring and anti-cheat, with tests**                                                               | `backend/races/scoring.py`, `backend/races/tests.py`                                                                                                  |
| **Live multiplayer**: Channels consumer, routing, ASGI                                               | `backend/races/consumers.py`, `routing.py`, `backend/config/asgi.py`                                                                                  |
| **TypeScript types (no `any`)**                                                                      | `frontend/src/types/index.ts`                                                                                                                         |
| **Smart vs presentational components**                                                               | `frontend/src/pages/` (containers), `frontend/src/components/` (presentational)                                                                       |
| **State management**                                                                                 | `frontend/src/store/` (Zustand: auth, toasts), `frontend/src/hooks/useTypingRace.ts`, `useRaceSocket.ts`                                              |
| **API client**: Axios, token refresh, error normalization                                            | `frontend/src/api/client.ts`, `auth.ts`, `races.ts`                                                                                                   |
| **Frontend error handling**: 400, 401, 403, 404, 500, network                                        | `frontend/src/api/client.ts` (interceptors, `getErrorMessage`), `components/Toaster.tsx`, `components/ErrorBoundary.tsx`, inline form errors          |
| **Canvas scene**                                                                                     | `frontend/src/components/TrailCanvas.tsx`                                                                                                             |
| **Project organization**                                                                             | Separate `backend/` and `frontend/` folders, `.gitignore`, `.env.example` files, Black and ESLint formatting                                          |

## Project structure

```
backend/
  config/       Django settings, URLs, ASGI entry point
  accounts/     Profiles, registration, JWT endpoints
  races/        Tracks, passages, races, scoring, leaderboard, WebSocket consumer
frontend/
  src/api/        Axios client and typed API functions
  src/components/ Presentational components (typing box, canvas, crew panel, ...)
  src/hooks/      useTypingRace, useRaceSocket
  src/pages/      Containers (login, home, lobby, race, leaderboard)
  src/store/      Zustand stores
  src/types/      Shared TypeScript types
```

## Running it locally

You need Python 3.10+ and Node 20+. The commands below are for Windows PowerShell. On macOS or Linux, use `source venv/bin/activate` and `cp` instead of `.\venv\Scripts\Activate.ps1` and `copy`.

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_data
python manage.py createsuperuser   # optional: needed only for staff-only endpoints and /admin
python manage.py runserver
```

`runserver` starts the Daphne ASGI server, which serves both the REST API and the WebSockets at http://127.0.0.1:8000.

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open **http://localhost:5173**. Use `localhost`, not `127.0.0.1`, because that is the origin the backend allows through CORS.

### Environment variables

| File            | Variable               | Purpose                                                                                                           |
| --------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `backend/.env`  | `SECRET_KEY`           | Django secret key (set your own)                                                                                  |
| `backend/.env`  | `DEBUG`                | `True` for local development                                                                                      |
| `backend/.env`  | `ALLOWED_HOSTS`        | Comma-separated hosts                                                                                             |
| `backend/.env`  | `CORS_ALLOWED_ORIGINS` | Frontend origin, e.g. `http://localhost:5173`                                                                     |
| `backend/.env`  | `REDIS_URL`            | Optional. If set (and `channels-redis` is installed), crew races use Redis instead of the in-memory channel layer |
| `frontend/.env` | `VITE_API_URL`         | Backend API base URL, e.g. `http://127.0.0.1:8000/api`                                                            |

### Tests and checks

```powershell
cd backend
python manage.py test races      # 10 unit tests for scoring and anti-cheat
black --check accounts config races manage.py

cd ../frontend
npm run lint
npm run build                    # runs the strict TypeScript check
```

## Trying a crew race

Crew races need two players, so use two browser sessions (one normal window and one private window):

1. In window A, log in, choose a trail under **Crew race**, and click **Host crew race**. You land in a lobby with a room code.
2. In window B, register a second account, enter the room code under **Join a race**, and click **Join**. Both lobbies show both players.
3. In window A (the host), click **Start race**. Both windows show a 3-2-1-GO countdown.
4. Type. Each window shows the other player's progress line moving in real time.
5. The first player to finish the passage correctly wins. Both windows show the winner and the standings.

## How the typing rules work

- You can type at most one character past a mistake, so you have to backspace and fix it before you can continue.
- Your climb (and your crew progress line) counts only correct characters.
- The race finishes only when the passage matches exactly.
- **Accuracy** is the share of keystrokes that were correct, so corrected mistakes lower it.
- **WPM** is correct characters divided by five, per minute.
- The server repeats the exact-match check and the speed check, so a client cannot claim a finish it did not earn.

## API overview

All endpoints except register, login, and refresh require an `Authorization: Bearer <access token>` header.

| Method    | Endpoint                                | Description                                                               |
| --------- | --------------------------------------- | ------------------------------------------------------------------------- |
| POST      | `/api/auth/register/`                   | Create an account                                                         |
| POST      | `/api/auth/login/`                      | Get access and refresh tokens                                             |
| POST      | `/api/auth/refresh/`                    | Refresh the access token                                                  |
| GET/PATCH | `/api/auth/me/`                         | The current player's profile                                              |
| GET       | `/api/tracks/`                          | List tracks (staff can create, edit, and delete)                          |
| GET       | `/api/passages/`                        | List passages; filter with `track` or `tag`, plus search and ordering     |
| GET/POST  | `/api/races/`                           | List or create races                                                      |
| GET       | `/api/races/<id>/`                      | Race detail with participants                                             |
| DELETE    | `/api/races/<id>/`                      | Cancel a waiting race (host only)                                         |
| POST      | `/api/races/join/`                      | Join a race by `room_code`                                                |
| POST      | `/api/races/<id>/submit/`               | Submit `typed`, `elapsed_seconds`, and `mistakes` for server-side scoring |
| GET       | `/api/leaderboard/`                     | Top results, optional `track` filter                                      |
| WS        | `/ws/races/<ROOM_CODE>/?token=<access>` | Live lobby, start, and progress for a crew race                           |

## Design notes

- Queries use `select_related` and `prefetch_related` to avoid N+1 problems, and `annotate` for per-track passage counts.
- Result submission runs in `transaction.atomic()` with row locks (`select_for_update`), so the score, finishing position, race status, and profile stats update together or not at all.
- The WebSocket layer only relays lobby state and display progress. Rankings come from the server-verified submit endpoint, which also broadcasts finished results to the room after the transaction succeeds.
- The socket authenticates with the same JWT as the REST API. The token travels in the connection URL, which is acceptable for local development; a production deployment would use a short-lived ticket instead.
- The frontend has no `any` types. Pages fetch data and pass it to presentational components, network calls live in `src/api`, and shared state lives in Zustand stores.
- Fonts (Big Shoulders Display, Michroma, IBM Plex Mono) load from Google Fonts, with system fallbacks if the network is unavailable.

## Limitations and future work

- The default in-memory channel layer works for a single local server process. Multi-process deployment needs Redis (`REDIS_URL` and `channels-redis`).
- Opponent progress lines are self-reported and are for display only. A scripted client calling the API directly could still submit the correct text at up to the speed cap, and closing that gap would need server-side validation of the full keystroke stream.
- No reconnect handling or spectators yet.
