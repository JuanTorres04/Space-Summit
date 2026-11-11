import { useCallback, useEffect, useRef, useState } from "react";
import { tokenStore } from "../api/client";
import type { ClientMessage, RaceStatus, ServerMessage } from "../types";

const WS_BASE = import.meta.env.VITE_API_URL.replace(/^http/, "ws").replace(
  /\/api\/?$/,
  "",
);

export interface FinishedResult {
  wpm: number;
  accuracy: number;
  position: number;
}

export interface RaceSocket {
  connected: boolean;
  started: boolean;
  status: RaceStatus;
  host: string;
  players: string[];
  progress: Record<string, number>;
  finished: Record<string, FinishedResult>;
  error: string | null;
  send: (message: ClientMessage) => void;
}

/** connects to a race room and then passes null for solo mode */
export function useRaceSocket(roomCode: string | null): RaceSocket {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<RaceStatus>("waiting");
  const [started, setStarted] = useState(false);
  const [host, setHost] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState<Record<string, FinishedResult>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) return;
    const token = tokenStore.getAccess();
    if (!token) return;

    let disposed = false;
    let opened = false;
    const ws = new WebSocket(
      `${WS_BASE}/ws/races/${roomCode}/?token=${encodeURIComponent(token)}`,
    );
    socketRef.current = ws;

    ws.onopen = () => {
      if (disposed) return;
      opened = true;
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      if (disposed) return;
      const message = JSON.parse(event.data) as ServerMessage;
      switch (message.type) {
        case "state":
          setStatus(message.status);
          setHost(message.host);
          setPlayers(message.players);
          if (message.status === "in_progress") setStarted(true);
          break;
        case "started":
          setStatus("in_progress");
          setStarted(true);
          break;
        case "progress":
          setProgress((prev) => ({
            ...prev,
            [message.username]: message.progress,
          }));
          break;
        case "finished":
          setFinished((prev) => ({
            ...prev,
            [message.username]: {
              wpm: message.wpm,
              accuracy: message.accuracy,
              position: message.position,
            },
          }));
          break;
      }
    };

    ws.onclose = () => {
      if (disposed) return;
      setConnected(false);
      setError(opened ? "Connection lost." : "Could not join this race room.");
    };

    return () => {
      disposed = true;
      ws.close();
      if (socketRef.current === ws) socketRef.current = null;
    };
  }, [roomCode]);

  const send = useCallback((message: ClientMessage) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify(message));
  }, []);

  return {
    connected,
    started,
    status,
    host,
    players,
    progress,
    finished,
    error,
    send,
  };
}
