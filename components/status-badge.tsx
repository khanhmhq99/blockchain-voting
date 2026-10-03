import { Badge } from "@/components/ui/badge";

const variants: Record<string, "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  ACTIVE: "success", APPROVED: "success", CONFIRMED: "success", REGISTRATION: "warning", PENDING: "warning",
  REJECTED: "destructive", FAILED: "destructive", CLOSED: "outline", DRAFT: "secondary",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={variants[status] ?? "secondary"}>{status.replaceAll("_", " ")}</Badge>;
}
