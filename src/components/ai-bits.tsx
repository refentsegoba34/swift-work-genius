import { useState, type ReactNode } from "react";
import { AlertTriangle, Check, ClipboardCopy, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ReviewNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
      AI-generated content should be reviewed before use.
    </p>
  );
}

export function MissingInfo({ items }: { items?: string[] | null }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Info className="size-3.5 text-warning" aria-hidden />
        Information not supplied
      </p>
      <ul className="mt-2 space-y-1 pl-5 text-xs text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2 text-sm text-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        {message}
      </p>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-card text-muted-foreground shadow-sm">
        {icon}
      </span>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function LoadingLines({ lines = 5 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i % 3 === 2 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
}: {
  value: string;
  label?: string;
  size?: "sm" | "default";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copying isn't available in this browser");
    }
  }

  return (
    <Button variant="outline" size={size} onClick={copy} disabled={!value}>
      {copied ? (
        <Check className="size-3.5 text-success" aria-hidden />
      ) : (
        <ClipboardCopy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}

const priorityStyles = {
  high: "bg-destructive/12 text-destructive border-destructive/30",
  medium: "bg-warning/15 text-foreground border-warning/40",
  low: "bg-success/12 text-success border-success/30",
} as const;

export function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
        priorityStyles[priority],
      )}
    >
      {priority}
    </span>
  );
}
