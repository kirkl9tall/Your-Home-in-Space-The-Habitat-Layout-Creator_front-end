import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

export function SuggestionPill({ text, onApply }: { text: string; onApply?: (s: string) => void }) {
  return (
    <Badge variant="outline" className="gap-2 bg-white/5">
      {text}
      {onApply && (
        <Button size="xs" variant="ghost" className="h-6 px-1" onClick={() => onApply(text)}>
          <Wand2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </Badge>
  );
}