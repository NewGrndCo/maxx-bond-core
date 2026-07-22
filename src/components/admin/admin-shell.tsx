import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  User,
  Music,
  Image as ImageIcon,
  Calendar,
  ShoppingBag,
  LayoutList,
  Link2,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/artist", label: "Artist Profile", icon: User },
  { to: "/admin/music", label: "Music", icon: Music },
  { to: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { to: "/admin/events", label: "Events", icon: Calendar },
  { to: "/admin/merch", label: "Merch", icon: ShoppingBag },
  { to: "/admin/sections", label: "Site Sections", icon: LayoutList },
  { to: "/admin/links", label: "Links", icon: Link2 },
  { to: "/admin/legal", label: "Legal", icon: FileText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ email, children }: { email: string | null; children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-neutral-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 md:min-h-screen shrink-0 border-b md:border-b-0 md:border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div
            className="text-xs uppercase tracking-[0.25em] text-amber-300/70"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Maxx Bond
          </div>
          <div className="mt-1 text-lg font-semibold">Admin</div>
        </div>
        <nav className="flex p-3 gap-1 overflow-x-auto md:flex-1 md:block md:space-y-0.5 md:overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex shrink-0 items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-amber-300/10 text-amber-200 border border-amber-300/20"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-white/5 border border-transparent",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden p-3 border-t border-white/5 space-y-2 md:block">
          <Link to="/" className="block text-xs text-neutral-500 hover:text-neutral-300 px-3">
            ← View public site
          </Link>
          <div className="px-3 text-xs text-neutral-500 truncate">{email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-neutral-400 hover:text-neutral-100"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-6xl mx-auto p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
