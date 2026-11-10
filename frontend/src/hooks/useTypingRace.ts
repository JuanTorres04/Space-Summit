import { useCallback, useEffect, useMemo, useState } from "react";

const CHARS_PER_WORD = 5;

export interface TypingRace {
  typed: string;
  finished: boolean;
  elapsedSeconds: number;
  wpm: number;
  accuracy: number;
  progress: number;
  handleChange: (value: string) => void;
}

export function useTypingRace(target: string): TypingRace {
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => performance.now());

  // Tick while the race is running so live WPM updates
  useEffect(() => {
    if (startedAt === null || finishedAt !== null) return;
    const id = window.setInterval(() => setNow(performance.now()), 200);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  const handleChange = useCallback(
    (value: string) => {
      if (finishedAt !== null) return;
      const next = value.slice(0, target.length);
      const t = performance.now();
      if (startedAt === null && next.length > 0) {
        setStartedAt(t);
        setNow(t);
      }
      setTyped(next);
      if (next.length === target.length) setFinishedAt(t);
    },
    [finishedAt, startedAt, target.length],
  );

  const correct = useMemo(() => {
    let count = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === target[i]) count++;
    }
    return count;
  }, [typed, target]);

  const endTime = finishedAt ?? now;
  const elapsedSeconds =
    startedAt === null ? 0 : Math.max((endTime - startedAt) / 1000, 0);
  const wpm =
    elapsedSeconds > 0 ? correct / CHARS_PER_WORD / (elapsedSeconds / 60) : 0;
  const accuracy = typed.length > 0 ? (correct / typed.length) * 100 : 100;
  const progress = target.length > 0 ? (typed.length / target.length) * 100 : 0;

  return {
    typed,
    finished: finishedAt !== null,
    elapsedSeconds,
    wpm,
    accuracy,
    progress,
    handleChange,
  };
}
