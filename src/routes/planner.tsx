import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, Clock, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  CopyButton,
  EmptyState,
  ErrorState,
  LoadingLines,
  MissingInfo,
  PriorityBadge,
  ReviewNotice,
} from "@/components/ai-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateSchedule } from "@/lib/ai.functions";
import type { PlannerTask, ScheduleResult } from "@/lib/ai-schemas";
import { useActivity } from "@/lib/activity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner & Scheduler — WorkFlow AI" },
      {
        name: "description",
        content:
          "Add your tasks with priority, deadline and duration, then generate a conflict-free daily or weekly schedule.",
      },
      { property: "og:title", content: "AI Task Planner & Scheduler — WorkFlow AI" },
      {
        property: "og:description",
        content: "Prioritised, non-overlapping daily and weekly schedules built from your task list.",
      },
    ],
  }),
  component: PlannerPage,
});

const PRIORITIES = ["high", "medium", "low"] as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft() {
  return { name: "", priority: "medium" as PlannerTask["priority"], deadline: "", duration: "60", notes: "" };
}

function PlannerPage() {
  const run = useServerFn(generateSchedule);
  const { logActivity } = useActivity();
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [draftError, setDraftError] = useState("");
  const [range, setRange] = useState<"daily" | "weekly">("daily");
  const [startDate, setStartDate] = useState(todayIso);
  const [workdayStart, setWorkdayStart] = useState("09:00");
  const [workdayEnd, setWorkdayEnd] = useState("17:00");
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTask() {
    const minutes = Number(draft.duration);
    if (draft.name.trim().length < 2) {
      setDraftError("Give the task a name.");
      return;
    }
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setDraftError("Estimated duration must be a number of minutes.");
      return;
    }
    setDraftError("");
    setTasks((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        name: draft.name.trim(),
        priority: draft.priority,
        deadline: draft.deadline,
        durationMinutes: Math.round(minutes),
        notes: draft.notes.trim(),
      },
    ]);
    setDraft(emptyDraft());
  }

  async function build() {
    if (tasks.length === 0) {
      setError("Add at least one task before generating a schedule.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const output = await run({
        data: { tasks, range, startDate, workdayStart, workdayEnd },
      });
      setSchedule(output);
      logActivity({
        kind: "schedule",
        title: `${range === "daily" ? "Daily" : "Weekly"} schedule generated`,
        detail: `${output.blocks.length} blocks from ${tasks.length} tasks`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scheduling failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setTasks([]);
    setSchedule(null);
    setError(null);
    setDraft(emptyDraft());
    setDraftError("");
  }

  const scheduleText = schedule
    ? [
        schedule.overview,
        "",
        ...schedule.blocks.map(
          (b) => `${b.day} ${b.date} · ${b.start}–${b.end} · ${b.task} (${b.priority}, ${b.durationMinutes} min)`,
        ),
        ...(schedule.unscheduled.length
          ? ["", "UNSCHEDULED", ...schedule.unscheduled.map((u) => `- ${u.task}: ${u.reason}`)]
          : []),
      ].join("\n")
    : "";

  const grouped = schedule
    ? schedule.blocks.reduce<Record<string, typeof schedule.blocks>>((acc, block) => {
        const key = `${block.day} · ${block.date}`;
        acc[key] = [...(acc[key] ?? []), block];
        return acc;
      }, {})
    : {};

  return (
    <AppShell
      title="AI Task Planner & Scheduler"
      description="Prioritised, non-overlapping schedules built from your own task list."
      actions={
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <Trash2 className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <section className="panel p-5" aria-label="Add a task">
            <p className="label-eyebrow">Step 1 — Add tasks</p>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="task-name">Task name</Label>
                <Input
                  id="task-name"
                  placeholder="Prepare client onboarding pack"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Priority</legend>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={draft.priority === p}
                      onClick={() => setDraft({ ...draft, priority: p })}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors",
                        draft.priority === p
                          ? "border-primary bg-primary/8"
                          : "border-border bg-surface text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="task-deadline">Deadline</Label>
                  <Input
                    id="task-deadline"
                    type="date"
                    value={draft.deadline}
                    onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="task-duration">Estimated duration (min)</Label>
                  <Input
                    id="task-duration"
                    type="number"
                    min={5}
                    step={5}
                    value={draft.duration}
                    onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-notes">Notes (optional)</Label>
                <Textarea
                  id="task-notes"
                  rows={2}
                  placeholder="Needs the finance figures first"
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>

              {draftError ? <p className="text-xs text-destructive">{draftError}</p> : null}

              <Button variant="outline" className="w-full" onClick={addTask}>
                <Plus className="size-4" aria-hidden />
                Add task
              </Button>
            </div>
          </section>

          <section className="panel p-5" aria-label="Task list">
            <div className="flex items-center justify-between">
              <p className="label-eyebrow">Your tasks</p>
              <span className="text-xs text-muted-foreground">{tasks.length} added</span>
            </div>
            {tasks.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-border bg-surface px-3 py-6 text-center text-xs text-muted-foreground">
                No tasks yet. Add your first one above.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{task.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <PriorityBadge priority={task.priority} />
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden />
                          {task.durationMinutes} min
                        </span>
                        <span>{task.deadline ? `due ${task.deadline}` : "no deadline"}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${task.name}`}
                      onClick={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))}
                    >
                      <X className="size-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="panel flex flex-col p-5" aria-label="Generated schedule">
          <p className="label-eyebrow">Step 2 — Generate schedule</p>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(["daily", "weekly"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={range === option}
                  onClick={() => setRange(option)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors",
                    range === option
                      ? "border-primary bg-primary/8"
                      : "border-border bg-surface text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="start-date">Start date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="day-start">Day starts</Label>
                <Input
                  id="day-start"
                  type="time"
                  value={workdayStart}
                  onChange={(e) => setWorkdayStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="day-end">Day ends</Label>
                <Input
                  id="day-end"
                  type="time"
                  value={workdayEnd}
                  onChange={(e) => setWorkdayEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={build} disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CalendarClock className="size-4" aria-hidden />
                )}
                {loading ? "Planning…" : `Generate ${range} schedule`}
              </Button>
              {schedule && !loading ? (
                <>
                  <Button variant="outline" onClick={build}>
                    <RefreshCw className="size-3.5" aria-hidden />
                    Regenerate
                  </Button>
                  <CopyButton value={scheduleText} label="Copy schedule" />
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex-1 space-y-4">
            {loading ? <LoadingLines lines={8} /> : null}
            {!loading && error ? <ErrorState message={error} onRetry={build} /> : null}
            {!loading && !error && !schedule ? (
              <EmptyState
                icon={<CalendarClock className="size-5" aria-hidden />}
                title="No schedule yet"
                description="Add your tasks, choose a range, and the AI will sequence them without overlaps."
              />
            ) : null}

            {!loading && schedule ? (
              <div className="space-y-4">
                <p className="rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed text-muted-foreground">
                  {schedule.overview}
                </p>

                {Object.entries(grouped).map(([day, blocks]) => (
                  <div key={day}>
                    <h2 className="text-sm font-semibold">{day}</h2>
                    <ul className="mt-2 space-y-2">
                      {blocks.map((block, i) => (
                        <li
                          key={`${day}-${block.start}-${i}`}
                          className="flex gap-3 rounded-lg border border-border bg-card p-3"
                        >
                          <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                            {block.start}
                            <br />
                            {block.end}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{block.task}</span>
                              <PriorityBadge priority={block.priority} />
                              <span className="text-xs text-muted-foreground">
                                {block.durationMinutes} min
                              </span>
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">{block.reason}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {schedule.unscheduled.length ? (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                    <p className="text-xs font-semibold">Could not be scheduled</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {schedule.unscheduled.map((item) => (
                        <li key={item.task}>
                          <span className="font-medium text-foreground">{item.task}</span> — {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <MissingInfo items={schedule.missingInformation} />
              </div>
            ) : null}
          </div>

          <ReviewNotice className="mt-5" />
        </section>
      </div>
    </AppShell>
  );
}
