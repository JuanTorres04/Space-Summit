import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { createRace, fetchPassagesForTrack, fetchTracks } from "../api/races";
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

  const handleStart = async (track: Track) => {
    setStarting(true);
    setError(null);
    try {
      const passages = await fetchPassagesForTrack(track.id);
      if (passages.length === 0) {
        setError("This track has no passages yet.");
        return;
      }
      const passage = passages[Math.floor(Math.random() * passages.length)];
      const race = await createRace(track.id, passage.id);
      navigate(`/race/${race.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="page wide">
      <header className="top-bar">
        <h1>Summit Sprint</h1>
        <p className="tagline">Mission Control - Choose a Path and Begin Your Ascent</p>
        <button onClick={signOut}>Log out</button>
      </header>

      {profile && (
        <p>
          {profile.display_name} · Best WPM: {profile.best_wpm} · Avg accuracy:{" "}
          {profile.avg_accuracy}% · Races: {profile.races_completed}
        </p>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading && <p>Scanning for tracks...</p>}

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
    </div>
  );
}
