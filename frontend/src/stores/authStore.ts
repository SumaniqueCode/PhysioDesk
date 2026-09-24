import { create } from "zustand";
import type { User } from "@/types/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  // Access token is kept in memory only; the refresh token lives in an httpOnly cookie.
  accessToken: string | null;
  status: AuthStatus;
  setSession: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "loading",
  setSession: (user, accessToken) => set({ user, accessToken, status: "authenticated" }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user, status: "authenticated" }),
  clear: () => set({ user: null, accessToken: null, status: "unauthenticated" }),
}));
