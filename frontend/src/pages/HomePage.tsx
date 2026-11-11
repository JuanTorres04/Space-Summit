import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import {
  createRace,
  fetchPassagesForTrack,
  fetchTracks,
  joinRace,
} from "../api/races";
import { TrackCard } from "../components/TrackCard";
import { useAuthStore } from "../store/authStore";
import type { Track } from "../types";

export function HomePage() {
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crewTrackId, setCrewTrackId] = useState<number | null>(null);
  const [joinCode, setJoinCode] = useState("");

  const crewTrack: Track | undefined =
    tracks.find((t) => t.id === crewTrackId) ?? tracks[0];

  useEffect(() => {
    let cancelled = false;
    fetchTracks()
      .then((data) => {
        if (!cancelled) setTracks(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = async (track: Track, crew = false) => {
    setStarting(true);
    setError(null);
    try {
      const passages = await fetchPassagesForTrack(track.id);
      if (passages.length === 0) {
        setError("This track has no passages yet.");
        return;
      }
      const lastId = Number(sessionStorage.getItem("lastPassageId"));
      const pool =
        passages.length > 1
          ? passages.filter((p) => p.id !== lastId)
          : passages;
      const passage = pool[Math.floor(Math.random() * pool.length)];
      sessionStorage.setItem("lastPassageId", String(passage.id));
      const race = await createRace(track.id, passage.id);
      navigate(crew ? `/crew/${race.id}` : `/race/${race.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError("Room codes have 6 characters.");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const race = await joinRace(code);
      navigate(`/crew/${race.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="page wide">
      <header className="top-bar">
        <div>
          <h1>Summit Sprint</h1>
          <p className="tagline">Mission control · choose a trail and climb</p>
        </div>
        <nav className="nav">
          <Link className="nav-link" to="/leaderboard">
            Leaderboard
          </Link>
          <button onClick={signOut}>Log out</button>
        </nav>
      </header>

      {profile && (
        <section className="stat-strip" aria-label="Pilot stats">
          <div className="stat-tile">
            <span className="stat-label">Pilot</span>
            <span className="stat-value">{profile.display_name}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Best WPM</span>
            <span className="stat-value">{profile.best_wpm}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Avg accuracy</span>
            <span className="stat-value">{profile.avg_accuracy}%</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Climbs</span>
            <span className="stat-value">{profile.races_completed}</span>
          </div>
        </section>
      )}

      <h2 className="section-title">Choose your ascent</h2>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="status-line">Scanning for trails...</p>}

      <div className="track-grid">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            disabled={starting}
            onStart={(t) => void handleStart(t)}
          />
        ))}
      </div>

      <h2 className="section-title crew-title">Crew race</h2>
      <section className="board crew-section" aria-label="Crew race">
        <div className="crew-block">
          <span className="stat-label">Host a race</span>
          <select
            aria-label="Trail for the crew race"
            value={crewTrack ? crewTrack.id : ""}
            onChange={(e) => setCrewTrackId(Number(e.target.value))}
          >
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            disabled={starting || !crewTrack}
            onClick={() => crewTrack && void handleStart(crewTrack, true)}
          >
            Host crew race
          </button>
        </div>
        <div className="crew-block">
          <span className="stat-label">Join a race</span>
          <input
            aria-label="Room code"
            maxLength={6}
            placeholder="ROOM CODE"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <button disabled={starting} onClick={() => void handleJoin()}>
            Join
          </button>
        </div>
      </section>
    </div>
  );
}
