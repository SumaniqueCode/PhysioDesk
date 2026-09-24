"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import type { LoginCredentials, TokenResponse, User } from "@/types/auth";

// Restore a session on load: /me 401s with no token, which the api client refreshes-and-retries.
export function useAuthBootstrap() {
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await apiFetch<User>("/auth/me");
        if (active) useAuthStore.getState().setUser(user);
      } catch {
        // Don't clobber a session a concurrent login may have just established.
        if (active && useAuthStore.getState().status !== "authenticated") {
          useAuthStore.getState().clear();
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);
}

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (creds: LoginCredentials): Promise<User> => {
      const token = await apiFetch<TokenResponse>("/auth/login", {
        method: "POST",
        body: creds,
        auth: false,
      });
      useAuthStore.getState().setAccessToken(token.access_token);
      const user = await apiFetch<User>("/auth/me");
      useAuthStore.getState().setSession(user, token.access_token);
      return user;
    },
    onSuccess: (user) => {
      toast.success(`Welcome back, ${user.full_name.split(" ")[0]}`);
      router.replace("/dashboard");
    },
    onError: (err) => {
      // A login that set a token but failed on /me must not leave an orphaned token.
      useAuthStore.getState().clear();
      const status = err instanceof ApiError ? err.status : 0;
      if (status === 401) toast.error("Invalid email or password");
      else if (status === 429) toast.error("Too many attempts. Please wait a moment and try again.");
      else toast.error("Something went wrong. Please try again.");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    // Logout is cookie-based; swallow errors so the client always ends up signed out.
    mutationFn: () => apiFetch("/auth/logout", { method: "POST", auth: false }).catch(() => {}),
    onSuccess: () => {
      useAuthStore.getState().clear();
      queryClient.clear();
      router.replace("/login");
    },
  });
}
