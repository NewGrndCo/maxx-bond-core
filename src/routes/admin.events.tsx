import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/coming-soon";

export const Route = createFileRoute("/admin/events")({
  component: () => <ComingSoon title="Events" description="Manage tour dates and events." />,
});
