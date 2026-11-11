import { useCallback, useEffect, useMemo, useState } from "react";

const CHARS_PER_WORD = 5;

export interface TypingRace {
  typed: string;
  finished: boolean;
  elapsedSeconds: number;
  wpm: number;
  accuracy: number;
  progress: number;
  correctChars: number;
  mistakes: number;
  handleChange: (value: string) => void;
}

/** how many characters at the start of typed match the target */
function correctPrefix(typed: string, target: string): number {
  let i = 0;
  while (i < typed.length && i < target.length && typed[i] === target[i]) i++;
  return i;
}

export function useTypingRace(target: string): TypingRace {
  const [typed, setTyped] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => performance.now());

  // tick while the race is running so live WPM updates
  useEffect(() => {
    if (startedAt === null || finishedAt !== null) return;
    const id = window.setInterval(() => setNow(performance.now()), 200);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  const handleChange = useCallback(
    (value: string) => {
      if (finishedAt !== null) return;
      const t = performance.now();
      let next = value.slice(0, target.length);

      if (next.length > typed.length) {
        // you can't go more than one character past a mistake
        next = next.slice(0, correctPrefix(next, target) + 1);
        if (next.length <= typed.length) return;

        setKeystrokes((k) => k + (next.length - typed.length));
        if (next[next.length - 1] !== target[next.length - 1]) {
          setMistakes((m) => m + 1);
        }
        if (startedAt === null) {
          setStartedAt(t);
          setNow(t);
        }
      }

      setTyped(next);
      // only an exact match finishes the race
      if (next === target) setFinishedAt(t);
    },
    [finishedAt, startedAt, target, typed],
  );

  const correctChars = useMemo(
    () => correctPrefix(typed, target),
    [typed, target],
  );

  const endTime = finishedAt ?? now;
  const elapsedSeconds =
    startedAt === null ? 0 : Math.max((endTime - startedAt) / 1000, 0);
  const wpm =
    elapsedSeconds > 0
      ? correctChars / CHARS_PER_WORD / (elapsedSeconds / 60)
      : 0;
  const accuracy =
    keystrokes > 0 ? ((keystrokes - mistakes) / keystrokes) * 100 : 100;
  const progress = target.length > 0 ? (correctChars / target.length) * 100 : 0;

  return {
    typed,
    finished: finishedAt !== null,
    elapsedSeconds,
    wpm,
    accuracy,
    progress,
    correctChars,
    mistakes,
    handleChange,
  };
}
