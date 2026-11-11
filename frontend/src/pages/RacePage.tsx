import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { fetchPassage, fetchRace, submitResult } from "../api/races";
import { Countdown } from "../components/Countdown";
import { CrewPanel } from "../components/CrewPanel";
import { RaceStandings } from "../components/RaceStandings";
import { TrailCanvas } from "../components/TrailCanvas";
import { TypingBox } from "../components/TypingBox";
import { useRaceSocket } from "../hooks/useRaceSocket";
import type { FinishedResult } from "../hooks/useRaceSocket";
import { useTypingRace } from "../hooks/useTypingRace";
import { useAuthStore } from "../store/authStore";
import type { Passage, SubmitResultResponse } from "../types";

interface RoundProps {
  raceId: number;
  passage: Passage;
  roomCode: string | null;
}

function Round({ raceId, passage, roomCode }: RoundProps) {
  const race = useTypingRace(passage.text);
  const crew = useRaceSocket(roomCode);
  const username = useAuthStore((state) => state.profile?.username ?? "");
  const crewMode = roomCode !== null;
  const [result, setResult] = useState<SubmitResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const submitted = useRef(false);
  const { finished, typed, elapsedSeconds, mistakes, correctChars } = race;
  const { started, send } = crew;

  // 3, 2, 1, GO once the host has started the race
  useEffect(() => {
    if (!crewMode || !started) return;
    const timer = window.setInterval(
      () => setTick((t) => Math.min(t + 1, 4)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [crewMode, started]);

  const ready = !crewMode || (started && tick >= 3);
  const count = crewMode && started ? 3 - tick : null;

  // share progress with the room only correct characters count
  useEffect(() => {
    if (crewMode && ready) send({ type: "progress", position: correctChars });
  }, [crewMode, ready, send, correctChars]);

  // submits once when the passage is complete
  useEffect(() => {
    if (!finished || submitted.current) return;
    submitted.current = true;
    submitResult(raceId, {
      typed,
      elapsed_seconds: Math.max(elapsedSeconds, 0.1),
      mistakes,
    })
      .then(setResult)
      .catch((err: unknown) => setError(getErrorMessage(err)));
  }, [finished, raceId, typed, elapsedSeconds, mistakes]);

  // everyones results with our own taken from the servers reply
  const standings: Record<string, FinishedResult> = result
    ? {
        ...crew.finished,
        [username]: {
          wpm: result.wpm,
          accuracy: result.accuracy,
          position: result.finish_position,
        },
      }
    : crew.finished;
  const winner =
    Object.entries(standings).find(([, entry]) => entry.position === 1)?.[0] ??
    null;

  let headline = "Event Horizon Crossed!";
  if (crewMode) {
    if (winner === username) headline = "You won the race!";
    else if (winner) headline = `${winner} won the race`;
    else headline = "Race complete";
  }

  return (
    <div className={finished ? "round is-finished" : "round"}>
      <Countdown count={count} waiting={crewMode && !started} />

      <h1>{passage.track_name}</h1>
      <TrailCanvas
        progress={race.progress}
        elevationM={passage.track_elevation_m}
      />
      <p className="stats">
        {Math.round(race.wpm)} WPM · {Math.round(race.accuracy)}% accuracy
      </p>

      {crewMode && (
        <CrewPanel
          players={crew.players}
          me={username}
          progress={{ ...crew.progress, [username]: race.progress }}
          finished={crew.finished}
        />
      )}
      {crewMode && crew.error && (
        <p className="error" role="alert">
          {crew.error}
        </p>
      )}

      <TypingBox
        target={passage.text}
        typed={race.typed}
        disabled={finished || !ready}
        onChange={race.handleChange}
      />
      {typed.length > correctChars && !finished && (
        <p className="status-line">
          Fix the highlighted mistake to keep climbing
        </p>
      )}

      {finished && !result && !error && <p>Submitting your result...</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <section className={crewMode ? "result crew-result" : "result"}>
          <h2>{headline}</h2>
          {crewMode && (
            <RaceStandings
              players={crew.players}
              me={username}
              finished={standings}
            />
          )}
          <p>
            Your result: {result.wpm} WPM · {result.accuracy}% accuracy
          </p>
          <Link to="/">Back to tracks</Link>
        </section>
      )}
    </div>
  );
}

export function RacePage() {
  const { raceId } = useParams<{ raceId: string }>();
  const [searchParams] = useSearchParams();
  const crewMode = searchParams.get("crew") === "1";
  const [passage, setPassage] = useState<Passage | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = Number(raceId);

  useEffect(() => {
    let cancelled = false;
    fetchRace(id)
      .then((race) => {
        if (!cancelled) setRoomCode(race.room_code);
        return fetchPassage(race.passage);
      })
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
      {passage && (!crewMode || roomCode) && (
        <Round
          raceId={id}
          passage={passage}
          roomCode={crewMode ? roomCode : null}
        />
      )}
    </div>
  );
}
