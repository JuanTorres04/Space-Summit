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
        <div>
          <h1>Leaderboard</h1>
          <p className="tagline">Fastest ascents across every trail</p>
        </div>
        <nav className="nav">
          <Link className="nav-link" to="/">
            Back to tracks
          </Link>
        </nav>
      </header>

      {loading && <p className="status-line">Loading...</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && entries.length === 0 && (
        <div className="board empty">
          No finished races yet. Be the first to cross the event horizon.
        </div>
      )}

      {entries.length > 0 && (
        <div className="board">
          <table className="leaderboard">
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Pilot</th>
                <th scope="col">Trail</th>
                <th scope="col">WPM</th>
                <th scope="col">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={`${entry.username}-${entry.finished_at}`}>
                  <td>
                    <span className="rank">{index + 1}</span>
                  </td>
                  <td>{entry.username}</td>
                  <td>{entry.track_name}</td>
                  <td className="wpm-cell">{entry.wpm}</td>
                  <td>{entry.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
