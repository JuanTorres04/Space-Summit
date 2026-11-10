import type { Track } from "../types";

interface TrackCardProps {
  track: Track;
  disabled: boolean;
  onStart: (track: Track) => void;
}

export function TrackCard({ track, disabled, onStart }: TrackCardProps) {
  return (
    <article className="track-card">
      <h2>{track.name}</h2>
      <p>{track.description}</p>
      <p className="meta">
        {track.difficulty} · {track.elevation_m.toLocaleString()} m ·{" "}
        {track.passage_count} passages
      </p>
      <button disabled={disabled} onClick={() => onStart(track)}>
        Begin Ascent
      </button>
    </article>
  );
}
