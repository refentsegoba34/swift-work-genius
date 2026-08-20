import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Clock,
  Mail,
  NotebookPen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ai-bits";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, useActivity, type ActivityKind } from "@/lib/activity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkFlow AI — AI workplace productivity dashboard" },
      {
        name: "description",
        content:
          "WorkFlow AI drafts professional emails, summarises meeting notes into decisions and action items, and builds conflict-free daily or weekly schedules.",
      },
      { property: "og:title", content: "WorkFlow AI — AI workplace productivity dashboard" },
      {
        property: "og:description",
        content:
          "Three AI tools in one dashboard: smart email drafting, meeting note summaries and an AI task scheduler.",
      },
    ],
  }),
  component: Dashboard,
});

const FEATURES = [
  {
    to: "/email" as const,
    label: "Smart Email Generator",
    icon: Mail,
    description:
      "Give a purpose, recipient and key points. Get a subject line and a structured email in a formal, friendly or persuasive tone.",
  },
  {
    to: "/summariser" as const,
    label: "Meeting Notes Summariser",
    icon: NotebookPen,
    description:
      "Paste long notes and get a concise summary, key decisions and action items with owners and deadlines — only where they are stated.",
  },
  {
    to: "/planner" as const,
    label: "AI Task Planner",
    icon: CalendarClock,
    description:
      "Capture tasks with priority, deadline and duration, then generate a non-overlapping daily or weekly schedule.",
  },
];

const ICONS: Record<ActivityKind, typeof Mail> = {
  email: Mail,
  summary: NotebookPen,
  schedule: CalendarClock,
};

function Dashboard() {
  const { activity, ready } = useActivity();

  const counts = {
    email: activity.filter((a) => a.kind === "email").length,
    summary: activity.filter((a) => a.kind === "summary").length,
    schedule: activity.filter((a) => a.kind === "schedule").length,
  };
  const total = activity.length;
  const minutesSaved = counts.email * 12 + counts.summary * 20 + counts.schedule * 15;

  const stats = [
    { label: "Emails drafted", value: counts.email },
    { label: "Meetings summarised", value: counts.summary },
    { label: "Schedules built", value: counts.schedule },
    { label: "Est. time saved", value: minutesSaved >= 60 ? `${(minutesSaved / 60).toFixed(1)} h` : `${minutesSaved} min` },
  ];

  return (
    <AppShell
      title="Dashboard"
      description="Your AI workplace copilot for email, meetings and planning."
      actions={
        <Button size="sm" asChild>
          <Link to="/email">
            <Sparkles className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">New email</span>
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        <section className="panel overflow-hidden p-6 sm:p-8">
          <p className="label-eyebrow">Welcome back</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Let's clear the admin, not the day.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            WorkFlow AI brings three everyday workplace tasks into one place: writing professional emails,
            turning messy meeting notes into decisions and action items, and planning your workload into a
            realistic schedule. Everything is generated from information you supply — and always yours to
            review and edit.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/email">
                Draft an email
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/summariser">Summarise notes</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/planner">Plan my day</Link>
            </Button>
          </div>
        </section>

        <section aria-label="Productivity overview">
          <p className="label-eyebrow mb-3">Productivity overview</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="panel p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums">{ready ? stat.value : "—"}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Estimates based on your activity in this browser: 12 min per email, 20 min per summary, 15 min per
            schedule.
          </p>
        </section>

        <section aria-label="Features">
          <p className="label-eyebrow mb-3">Core features</p>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.to}
                  to={feature.to}
                  className="panel group flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-raised)]"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{feature.label}</h3>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    Open
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="panel p-5" aria-label="Recent activity">
            <div className="flex items-center justify-between">
              <p className="label-eyebrow">Recent activity</p>
              {total > 0 ? (
                <Link to="/activity" className="text-xs font-medium text-primary hover:underline">
                  View all
                </Link>
              ) : null}
            </div>
            {!ready ? (
              <p className="py-8 text-center text-xs text-muted-foreground">Loading…</p>
            ) : total === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<Activity className="size-5" aria-hidden />}
                  title="Nothing here yet"
                  description="Your generated emails, summaries and schedules will show up here."
                />
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {activity.slice(0, 5).map((item) => {
                  const Icon = ICONS[item.kind];
                  return (
                    <li key={item.id} className="flex items-start gap-3 py-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-primary">
                        <Icon className="size-3.5" aria-hidden />
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

          <section className="panel p-5" aria-label="Quick actions and responsible AI">
            <p className="label-eyebrow">Quick actions</p>
            <div className="mt-3 space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/email">
                  <Mail className="size-4" aria-hidden />
                  Draft a status update
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/summariser">
                  <NotebookPen className="size-4" aria-hidden />
                  Summarise today's meeting
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/planner">
                  <Clock className="size-4" aria-hidden />
                  Build tomorrow's schedule
                </Link>
              </Button>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-surface p-3">
              <p className="flex items-center gap-2 text-xs font-semibold">
                <ShieldCheck className="size-3.5 text-primary" aria-hidden />
                Responsible AI
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                WorkFlow AI never invents facts, people or deadlines. Missing details are flagged instead of
                guessed. AI-generated content should be reviewed before use.
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
