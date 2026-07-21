import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/coming-soon";

export const Route = createFileRoute("/admin/legal")({
  component: () => <ComingSoon title="Legal" description="Privacy Policy and Terms of Service." />,
});
