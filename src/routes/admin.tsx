import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminShell } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [
      { title: "Admin — Maxx Bond" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminLayout() {
  const auth = useAdminAuth();

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0d] text-neutral-400 flex items-center justify-center">
        <div className="text-sm">Loading…</div>
      </div>
    );
  }

  // Not signed in — show login (or onboarding if no admin exists yet)
  if (!auth.session) {
    return (
      <>
        <Toaster theme="dark" />
        <AdminLogin
          onboarding={auth.anyAdminExists === false}
          onAuthed={auth.refresh}
        />
      </>
    );
  }

  // Signed in but not admin
  if (!auth.isAdmin) {
    return (
      <>
        <Toaster theme="dark" />
        <NoAccessScreen
          email={auth.email}
          canClaim={auth.anyAdminExists === false}
          onClaimed={auth.refresh}
        />
      </>
    );
  }

  return (
    <>
      <Toaster theme="dark" />
      <AdminShell email={auth.email}>
        <Outlet />
      </AdminShell>
    </>
  );
}

function NoAccessScreen({
  email,
  canClaim,
  onClaimed,
}: {
  email: string | null;
  canClaim: boolean;
  onClaimed: () => Promise<void>;
}) {
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };
  const claim = async () => {
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error) return toast.error(error.message);
    if (data) {
      toast.success("Admin access granted");
      await onClaimed();
    } else {
      toast.error("An admin already exists");
    }
  };
  return (
    <div className="min-h-screen bg-[#0b0b0d] text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div
          className="text-xs uppercase tracking-[0.35em] text-amber-300/70"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Maxx Bond
        </div>
        <h1 className="mt-2 text-2xl font-semibold">
          {canClaim ? "Claim admin access" : "No admin access"}
        </h1>
        <p className="mt-3 text-sm text-neutral-400">
          Signed in as <span className="text-neutral-200">{email}</span>.{" "}
          {canClaim
            ? "No admin exists yet. Claim this account as the first admin."
            : "This account does not have admin permissions. Contact an existing admin."}
        </p>
        <div className="mt-6 flex gap-2 justify-center">
          {canClaim && (
            <Button className="bg-amber-300 text-black hover:bg-amber-200" onClick={claim}>
              Claim admin
            </Button>
          )}
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
