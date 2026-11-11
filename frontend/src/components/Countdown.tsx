interface CountdownProps {
  count: number | null;
  waiting: boolean;
}

export function Countdown({ count, waiting }: CountdownProps) {
  if (waiting) {
    return (
      <div className="countdown" role="status">
        <p className="countdown-sub">Waiting for the race to start</p>
      </div>
    );
  }
  if (count === null || count < 0) return null;
  const label = count === 0 ? "GO" : String(count);
  return (
    <div className="countdown" role="status" aria-live="assertive">
      <span
        key={label}
        className={count === 0 ? "countdown-num go" : "countdown-num"}
      >
        {label}
      </span>
      {count > 0 && <p className="countdown-sub">Get ready</p>}
    </div>
  );
}
