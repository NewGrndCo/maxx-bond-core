import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/coming-soon";

export const Route = createFileRoute("/admin/sections")({
  component: () => <ComingSoon title="Site Sections" description="Edit section headings and copy." />,
});
