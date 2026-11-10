import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { fetchLeaderboard } from "../api/races";
import type { LeaderboardEntry } from "../types";

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard()
      .then((data) => {
        if (!cancelled) setEntries(data);
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

  return (
    <div className="page wide">
      <header className="top-bar">
        <h1>Leaderboard</h1>
        <Link to="/">Back to tracks</Link>
      </header>

      {loading && <p>Loading...</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && entries.length === 0 && (
        <p>No finished races yet.</p>
      )}

      {entries.length > 0 && (
        <table className="leaderboard">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Player</th>
              <th scope="col">Track</th>
              <th scope="col">WPM</th>
              <th scope="col">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={`${entry.username}-${entry.finished_at}`}>
                <td>{index + 1}</td>
                <td>{entry.username}</td>
                <td>{entry.track_name}</td>
                <td>{entry.wpm}</td>
                <td>{entry.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
