import createContextHook from "@nkzw/create-context-hook";
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Wrong email or password. Please try again.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "That email already has an account. Try signing in instead.";
  if (m.includes("password") && m.includes("6"))
    return "Password must be at least 6 characters.";
  if (m.includes("email") && m.includes("valid"))
    return "Please enter a valid email address.";
  if (m.includes("email not confirmed") || m.includes("confirm your email") || m.includes("verification"))
    return "Please verify your email address. Check your inbox for the confirmation link.";
  if (m.includes("provider is not enabled"))
    return "Google sign-in isn't activated yet. Use email and password for now.";
  return message;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setInitializing(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(friendlyAuthError(error.message));
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });
      if (error) throw new Error(friendlyAuthError(error.message));
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = Linking.createURL("/auth/callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    if (!data?.url) throw new Error("Could not start Google sign-in.");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) return;

    const url = result.url;
    const params = new URL(url).searchParams;
    const code = params.get("code");
    if (code) {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw new Error(friendlyAuthError(exchangeError.message));
      return;
    }
    // Implicit flow fallback: tokens come back in the URL fragment.
    const hash = url.includes("#") ? url.split("#")[1] : "";
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (accessToken && refreshToken) {
      const { error: setError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setError) throw new Error(friendlyAuthError(setError.message));
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return useMemo(
    () => ({
      session,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
      displayName:
        (session?.user.user_metadata?.name as string | undefined) ?? null,
      isAuthenticated: !!session,
      initializing,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [session, initializing, signIn, signUp, signInWithGoogle, signOut],
  );
});
