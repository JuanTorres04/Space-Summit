import type { FinishedResult } from "../hooks/useRaceSocket";

interface RaceStandingsProps {
  players: string[];
  me: string;
  finished: Record<string, FinishedResult>;
}

export function RaceStandings({ players, me, finished }: RaceStandingsProps) {
  const rows = [...players].sort((a, b) => {
    const pa = finished[a]?.position ?? Number.MAX_SAFE_INTEGER;
    const pb = finished[b]?.position ?? Number.MAX_SAFE_INTEGER;
    return pa - pb;
  });

  return (
    <ol className="standings" aria-label="Race standings">
      {rows.map((name) => {
        const entry = finished[name];
        return (
          <li key={name} className={name === me ? "standing me" : "standing"}>
            <span className="standing-rank">
              {entry ? entry.position : "-"}
            </span>
            <span className="standing-name">{name}</span>
            <span className="standing-stat">
              {entry
                ? `${entry.wpm} WPM · ${entry.accuracy}%`
                : "still racing..."}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
