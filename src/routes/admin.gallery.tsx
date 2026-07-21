import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/coming-soon";

export const Route = createFileRoute("/admin/gallery")({
  component: () => <ComingSoon title="Gallery" description="Manage photo gallery items." />,
});
