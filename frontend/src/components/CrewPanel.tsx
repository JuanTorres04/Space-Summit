import type { FinishedResult } from "../hooks/useRaceSocket";

interface CrewPanelProps {
  players: string[];
  me: string;
  progress: Record<string, number>;
  finished: Record<string, FinishedResult>;
}

export function CrewPanel({ players, me, progress, finished }: CrewPanelProps) {
  return (
    <ul className="crew-panel" aria-label="Crew progress">
      {players.map((name) => {
        const done = finished[name];
        const pct = done ? 100 : (progress[name] ?? 0);
        return (
          <li key={name} className={name === me ? "crew-row me" : "crew-row"}>
            <span className="crew-name">{name}</span>
            <span className="crew-track">
              <span className="crew-fill" style={{ width: `${pct}%` }} />
            </span>
            <span className="crew-meta">
              {done
                ? `#${done.position} · ${done.wpm} WPM`
                : `${Math.round(pct)}%`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
