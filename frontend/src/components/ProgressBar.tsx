interface ProgressBarProps {
  value: number;
  label: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className="trail"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="trail-line">
        <div className="trail-fill" style={{ width: `${pct}%` }} />
      </div>
      <span
        className="trail-astronaut"
        style={{ left: `${pct}%` }}
        aria-hidden="true"
      >
        🧑‍🚀
      </span>
      <span className="trail-flag" aria-hidden="true">
        🚩
      </span>
    </div>
  );
}
