import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminAuthState = {
  loading: boolean;
  session: Session | null;
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  anyAdminExists: boolean | null;
  refresh: () => Promise<void>;
};

export function useAdminAuth(): AdminAuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [anyAdminExists, setAnyAdminExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const evaluate = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    // admin_exists is anon-callable
    const { data: existsData } = await supabase.rpc("admin_exists");
    setAnyAdminExists(Boolean(existsData));

    if (nextSession?.user) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", nextSession.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!error && !!data);
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await evaluate(data.session ?? null);
  }, [evaluate]);

  useEffect(() => {
    // Set up listener first
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      void evaluate(s ?? null);
    });
    // Then check initial session
    void refresh();
    return () => sub.subscription.unsubscribe();
  }, [evaluate, refresh]);

  return {
    loading,
    session,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    isAdmin,
    anyAdminExists,
    refresh,
  };
}
