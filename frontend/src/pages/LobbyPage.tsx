import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { fetchRace } from "../api/races";
import { useRaceSocket } from "../hooks/useRaceSocket";
import { useAuthStore } from "../store/authStore";
import type { Race } from "../types";

export function LobbyPage() {
  const { raceId } = useParams<{ raceId: string }>();
  const id = Number(raceId);
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const [race, setRace] = useState<Race | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRace(id)
      .then((data) => {
        if (!cancelled) setRace(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const crew = useRaceSocket(race ? race.room_code : null);

  // when the host starts the race everyone moves to the race screen
  useEffect(() => {
    if (crew.started) navigate(`/race/${id}?crew=1`, { replace: true });
  }, [crew.started, id, navigate]);

  const isHost = profile !== null && crew.host === profile.username;
  const problem = error ?? crew.error;

  return (
    <div className="page wide">
      <header className="top-bar">
        <div>
          <h1>Crew lobby</h1>
          <p className="tagline">{race ? race.track_name : "Connecting..."}</p>
        </div>
        <nav className="nav">
          <Link className="nav-link" to="/">
            Leave
          </Link>
        </nav>
      </header>

      {problem && (
        <p className="error" role="alert">
          {problem}
        </p>
      )}

      {race && (
        <section className="lobby">
          <div className="stat-tile">
            <span className="stat-label">Room code</span>
            <span className="room-code">{race.room_code}</span>
            <span className="status-line">Share this code with your crew</span>
          </div>

          <div className="board">
            <h2 className="section-title">Crew ({crew.players.length})</h2>
            <ul className="crew-list">
              {crew.players.map((name) => (
                <li key={name}>
                  <span>{name}</span>
                  {name === crew.host && <span className="badge">host</span>}
                </li>
              ))}
            </ul>
          </div>

          {isHost ? (
            <button
              disabled={!crew.connected}
              onClick={() => crew.send({ type: "start" })}
            >
              Start race
            </button>
          ) : (
            <p className="status-line">Waiting for the host to start...</p>
          )}
        </section>
      )}
    </div>
  );
}
