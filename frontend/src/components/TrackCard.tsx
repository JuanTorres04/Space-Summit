import type { Track } from "../types";

interface TrackCardProps {
  track: Track;
  disabled: boolean;
  onStart: (track: Track) => void;
}

const MAX_ELEVATION_M = 22000;

export function TrackCard({ track, disabled, onStart }: TrackCardProps) {
  const pct = Math.min(100, (track.elevation_m / MAX_ELEVATION_M) * 100);

  return (
    <article className={`track-card ${track.difficulty}`}>
      <div className="track-head">
        <div className="orb" aria-hidden="true" />
        <div>
          <h2>{track.name}</h2>
          <span className="badge">{track.difficulty}</span>
        </div>
      </div>

      <p className="track-desc">{track.description}</p>

      <div className="meta-row">
        <span>Elevation</span>
        <strong>{track.elevation_m.toLocaleString()} m</strong>
      </div>
      <div className="elev-bar" aria-hidden="true">
        <div className="elev-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="meta-row">
        <span>Passages</span>
        <strong>{track.passage_count}</strong>
      </div>

      <button disabled={disabled} onClick={() => onStart(track)}>
        Begin ascent
      </button>
    </article>
  );
}
