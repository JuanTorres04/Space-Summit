import { api, tokenStore } from "./client";
import type { Credentials, Profile, RegisterPayload, TokenPair } from "../types";

export async function login(credentials: Credentials): Promise<void> {
  const { data } = await api.post<TokenPair>("/auth/login/", credentials);
  tokenStore.setTokens(data);
}

export async function register(payload: RegisterPayload): Promise<void> {
  await api.post("/auth/register/", payload);
}

export async function fetchProfile(): Promise<Profile> {
  const { data } = await api.get<Profile>("/auth/me/");
  return data;
}