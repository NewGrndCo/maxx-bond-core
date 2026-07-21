import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/coming-soon";

export const Route = createFileRoute("/admin/merch")({
  component: () => <ComingSoon title="Merch" description="Manage merchandise listings." />,
});
