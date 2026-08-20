import { createFileRoute } from "@tanstack/react-router";
import { Activity, CalendarClock, Mail, NotebookPen, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ai-bits";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, useActivity, type ActivityKind } from "@/lib/activity";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Recent Activity — WorkFlow AI" },
      {
        name: "description",
        content: "A running log of the emails, meeting summaries and schedules you have generated in WorkFlow AI.",
      },
      { property: "og:title", content: "Recent Activity — WorkFlow AI" },
      { property: "og:description", content: "Track everything you have generated with WorkFlow AI." },
    ],
  }),
  component: ActivityPage,
});

const ICONS: Record<ActivityKind, typeof Mail> = {
  email: Mail,
  summary: NotebookPen,
  schedule: CalendarClock,
};

function ActivityPage() {
  const { activity, clearActivity, ready } = useActivity();

  return (
    <AppShell
      title="Recent Activity"
      description="Everything you have generated, stored locally on this device."
      actions={
        activity.length ? (
          <Button variant="ghost" size="sm" onClick={clearActivity}>
            <Trash2 className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Clear log</span>
          </Button>
        ) : null
      }
    >
      <section className="panel p-5">
        {!ready ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Loading activity…</p>
        ) : activity.length === 0 ? (
          <EmptyState
            icon={<Activity className="size-5" aria-hidden />}
            title="No activity yet"
            description="Generate an email, a meeting summary or a schedule and it will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {activity.map((item) => {
              const Icon = ICONS[item.kind];
              return (
                <li key={item.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {formatRelativeTime(item.at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
