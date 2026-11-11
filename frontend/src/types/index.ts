export type Difficulty = "easy" | "moderate" | "hard";
export type RaceStatus = "waiting" | "in_progress" | "finished";

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Track {
  id: number;
  name: string;
  description: string;
  elevation_m: number;
  difficulty: Difficulty;
  passage_count: number;
}

export interface Passage {
  id: number;
  track: number;
  track_name: string;
  text: string;
  source: string;
  word_count: number;
  tags: string[];
  track_elevation_m: number;
}

export interface RaceParticipant {
  username: string;
  wpm: number | null;
  accuracy: number | null;
  finish_position: number | null;
  finished_at: string | null;
}

export interface Race {
  id: number;
  room_code: string;
  host_username: string;
  track: number;
  track_name: string;
  passage: number;
  status: RaceStatus;
  participants: RaceParticipant[];
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface Profile {
  username: string;
  display_name: string;
  avatar: string;
  best_wpm: number;
  avg_accuracy: number;
  races_completed: number;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface RegisterPayload extends Credentials {
  email: string;
}

export interface SubmitResultPayload {
  typed: string;
  elapsed_seconds: number;
}

export interface SubmitResultResponse {
  wpm: number;
  accuracy: number;
  finish_position: number;
}

export interface LeaderboardEntry {
  username: string;
  track_name: string;
  wpm: number;
  accuracy: number;
  finished_at: string;
}

export interface ApiErrorBody {
  detail?: string;
  [field: string]: string | string[] | undefined;
}

export type ClientMessage =
  | { type: "start" }
  | { type: "progress"; position: number };

export type ServerMessage =
  | { type: "state"; status: RaceStatus; host: string; players: string[] }
  | { type: "started" }
  | { type: "progress"; username: string; progress: number }
  | {
      type: "finished";
      username: string;
      wpm: number;
      accuracy: number;
      position: number;
    };
