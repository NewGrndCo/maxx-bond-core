import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/coming-soon";

export const Route = createFileRoute("/admin/music")({
  component: () => <ComingSoon title="Music" description="Manage tracks and audio uploads." />,
});
