import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export function AdminLogin({
  onboarding,
  onAuthed,
}: {
  onboarding: boolean;
  onAuthed: () => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>(onboarding ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (onboarding) {
          const { data, error: rpcErr } = await supabase.rpc("claim_first_admin");
          if (rpcErr) throw rpcErr;
          if (data) toast.success("Admin access granted");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        // Try to sign in immediately (in case email confirmation is off)
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInData.session && onboarding) {
          const { data, error: rpcErr } = await supabase.rpc("claim_first_admin");
          if (rpcErr) throw rpcErr;
          if (data) toast.success("You are now the site admin");
        } else if (!signInData.session) {
          toast.success("Check your email to confirm your account");
        }
      }
      await onAuthed();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="text-xs uppercase tracking-[0.35em] text-amber-300/70"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Maxx Bond
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Admin</h1>
          <p className="mt-2 text-sm text-neutral-400">
            {onboarding
              ? "No admin exists yet. Create the first admin account to get started."
              : "Sign in to manage the Maxx Bond site."}
          </p>
        </div>

        <div className="relative rounded-2xl border border-amber-300/20 bg-white/[0.03] backdrop-blur-xl p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/40 border-white/10 text-neutral-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/40 border-white/10 text-neutral-100"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-amber-300 text-black hover:bg-amber-200 font-semibold"
            >
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? onboarding
                    ? "Create admin account"
                    : "Create account"
                  : "Sign in"}
            </Button>
          </form>

          {!onboarding && (
            <div className="mt-6 text-center text-sm text-neutral-400">
              {mode === "signin" ? (
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-amber-300 hover:text-amber-200"
                >
                  Need an account? Sign up
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-amber-300 hover:text-amber-200"
                >
                  Have an account? Sign in
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-neutral-500 hover:text-neutral-300">
            ← Back to site
          </a>
        </div>
      </div>
    </div>
  );
}
