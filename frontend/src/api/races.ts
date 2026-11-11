import { api } from "./client";
import type {
  LeaderboardEntry,
  Paginated,
  Passage,
  Race,
  SubmitResultPayload,
  SubmitResultResponse,
  Track,
} from "../types";

export async function fetchTracks(): Promise<Track[]> {
  const { data } = await api.get<Paginated<Track>>("/tracks/");
  return data.results;
}

export async function fetchPassagesForTrack(
  trackId: number,
): Promise<Passage[]> {
  const { data } = await api.get<Paginated<Passage>>("/passages/", {
    params: { track: trackId },
  });
  return data.results;
}

export async function fetchPassage(id: number): Promise<Passage> {
  const { data } = await api.get<Passage>(`/passages/${id}/`);
  return data;
}

export async function createRace(
  track: number,
  passage: number,
): Promise<Race> {
  const { data } = await api.post<Race>("/races/", { track, passage });
  return data;
}

export async function fetchRace(id: number): Promise<Race> {
  const { data } = await api.get<Race>(`/races/${id}/`);
  return data;
}

export async function submitResult(
  raceId: number,
  payload: SubmitResultPayload,
): Promise<SubmitResultResponse> {
  const { data } = await api.post<SubmitResultResponse>(
    `/races/${raceId}/submit/`,
    payload,
  );
  return data;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<Paginated<LeaderboardEntry>>("/leaderboard/");
  return data.results;
}

export async function joinRace(roomCode: string): Promise<Race> {
  const { data } = await api.post<Race>("/races/join/", {
    room_code: roomCode,
  });
  return data;
}
