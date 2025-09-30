import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Info } from "lucide-react";

export function RuleChip({ valid }: { valid: boolean | "info" }) {
  if (valid === "info") {
    return (
      <Badge variant="outline" className="gap-1">
        <Info className="h-3.5 w-3.5" /> INFO
      </Badge>
    );
  }
  return valid ? (
    <Badge className="gap-1 bg-[var(--brand)] hover:bg-[var(--brand-2)]">
      <CheckCircle2 className="h-3.5 w-3.5" /> PASS
    </Badge>
  ) : (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3.5 w-3.5" /> FAIL
    </Badge>
  );
}