import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({
  component: Overview,
});

function StatCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <Card className="bg-white/[0.03] border-white/10 text-neutral-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-amber-200">{value}</div>
        {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function Overview() {
  const counts = useQuery({
    queryKey: ["admin-overview-counts"],
    queryFn: async () => {
      const tables = [
        "tracks",
        "gallery_items",
        "events",
        "merch_items",
        "streaming_links",
      ] as const;
      const results = await Promise.all(
        tables.map((t) =>
          supabase.from(t).select("*", { count: "exact", head: true }),
        ),
      );
      return Object.fromEntries(
        tables.map((t, i) => [t, results[i].count ?? 0]),
      ) as Record<(typeof tables)[number], number>;
    },
  });

  const c = counts.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Overview</h1>
        <p className="text-neutral-400 mt-1 text-sm">
          Welcome back. Manage every part of the Maxx Bond site from here.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Tracks" value={c?.tracks ?? "—"} />
        <StatCard title="Gallery" value={c?.gallery_items ?? "—"} />
        <StatCard title="Events" value={c?.events ?? "—"} />
        <StatCard title="Merch" value={c?.merch_items ?? "—"} />
        <StatCard title="Streaming" value={c?.streaming_links ?? "—"} />
      </div>

      <Card className="bg-white/[0.03] border-white/10 text-neutral-100">
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Link to="/admin/artist" className="rounded-md border border-white/10 p-4 hover:border-amber-300/40 hover:bg-amber-300/5 transition">
            <div className="text-amber-200 text-sm font-medium">Edit artist profile</div>
            <div className="text-xs text-neutral-500 mt-1">Name, bio, contact and hero images</div>
          </Link>
          <Link to="/" className="rounded-md border border-white/10 p-4 hover:border-amber-300/40 hover:bg-amber-300/5 transition">
            <div className="text-amber-200 text-sm font-medium">View public site</div>
            <div className="text-xs text-neutral-500 mt-1">Preview what visitors see</div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
