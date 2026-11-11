import { create } from "zustand";
import { fetchProfile, login, register } from "../api/auth";
import { tokenStore } from "../api/client";
import type { Credentials, Profile, RegisterPayload } from "../types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  profile: Profile | null;
  status: AuthStatus;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  restore: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  status: tokenStore.getAccess() ? "loading" : "anonymous",

  signIn: async (credentials) => {
    await login(credentials);
    const profile = await fetchProfile();
    set({ profile, status: "authenticated" });
  },

  signUp: async (payload) => {
    await register(payload);
    await login({ username: payload.username, password: payload.password });
    const profile = await fetchProfile();
    set({ profile, status: "authenticated" });
  },

  restore: async () => {
    if (!tokenStore.getAccess()) {
      set({ profile: null, status: "anonymous" });
      return;
    }
    try {
      const profile = await fetchProfile();
      set({ profile, status: "authenticated" });
    } catch {
      tokenStore.clear();
      set({ profile: null, status: "anonymous" });
    }
  },

  refreshProfile: async () => {
    const profile = await fetchProfile();
    set({ profile, status: "authenticated" });
  },

  signOut: () => {
    tokenStore.clear();
    set({ profile: null, status: "anonymous" });
  },
}));
