import * as React from "react";
import { cn } from "@/lib/utils";

type PanelProps = React.HTMLAttributes<HTMLDivElement>;

export function Panel({ className, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        "border-[var(--border-weak)] bg-[var(--surface-1)] backdrop-blur",
        "shadow-[var(--glow)]",
        className
      )}
      {...props}
    />
  );
}