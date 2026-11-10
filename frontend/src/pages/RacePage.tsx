import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { fetchPassage, fetchRace, submitResult } from "../api/races";
import { ProgressBar } from "../components/ProgressBar";
import { TypingBox } from "../components/TypingBox";
import { useTypingRace } from "../hooks/useTypingRace";
import type { Passage, SubmitResultResponse } from "../types";

interface RoundProps {
  raceId: number;
  passage: Passage;
}

function Round({ raceId, passage }: RoundProps) {
  const race = useTypingRace(passage.text);
  const [result, setResult] = useState<SubmitResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);
  const { finished, typed, elapsedSeconds } = race;

  // Submit once when the passage is complete
  useEffect(() => {
    if (!finished || submitted.current) return;
    submitted.current = true;
    submitResult(raceId, {
      typed,
      elapsed_seconds: Math.max(elapsedSeconds, 0.1),
    })
      .then(setResult)
      .catch((err: unknown) => setError(getErrorMessage(err)));
  }, [finished, raceId, typed, elapsedSeconds]);

  return (
    <>
      <h1>{passage.track_name}</h1>
      <ProgressBar value={race.progress} label="Climb progress" />
      <p className="stats">
        {Math.round(race.wpm)} WPM · {Math.round(race.accuracy)}% accuracy
      </p>

      <TypingBox
        target={passage.text}
        typed={race.typed}
        disabled={race.finished}
        onChange={race.handleChange}
      />

      {race.finished && !result && !error && <p>Submitting your result...</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <section className="result">
          <h2>Summit reached!</h2>
          <p>
            {result.wpm} WPM · {result.accuracy}% accuracy
          </p>
          <Link to="/">Back to tracks</Link>
        </section>
      )}
    </>
  );
}

export function RacePage() {
  const { raceId } = useParams<{ raceId: string }>();
  const [passage, setPassage] = useState<Passage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = Number(raceId);

  useEffect(() => {
    let cancelled = false;
    fetchRace(id)
      .then((race) => fetchPassage(race.passage))
      .then((data) => {
        if (!cancelled) setPassage(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="page wide">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!passage && !error && <p>Preparing for ascent...</p>}
      {passage && <Round raceId={id} passage={passage} />}
    </div>
  );
}
