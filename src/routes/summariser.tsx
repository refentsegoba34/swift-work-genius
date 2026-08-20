import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarDays, Loader2, NotebookPen, RefreshCw, Trash2, User, Wand2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  CopyButton,
  EmptyState,
  ErrorState,
  LoadingLines,
  MissingInfo,
  ReviewNotice,
} from "@/components/ai-bits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { summariseMeetingNotes } from "@/lib/ai.functions";
import { notesInputSchema, type MeetingSummaryResult } from "@/lib/ai-schemas";
import { useActivity } from "@/lib/activity";

export const Route = createFileRoute("/summariser")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summariser — WorkFlow AI" },
      {
        name: "description",
        content:
          "Paste long meeting notes and get a concise summary, key decisions, action items, owners and deadlines — strictly from your notes.",
      },
      { property: "og:title", content: "Meeting Notes Summariser — WorkFlow AI" },
      {
        property: "og:description",
        content: "Concise summaries, decisions and action items extracted from your own meeting notes.",
      },
    ],
  }),
  component: SummariserPage,
});

function toPlainText(result: MeetingSummaryResult) {
  const lines = ["SUMMARY", result.summary, ""];
  lines.push("KEY DECISIONS");
  lines.push(...(result.keyDecisions.length ? result.keyDecisions.map((d) => `- ${d}`) : ["- None stated"]));
  lines.push("", "ACTION ITEMS");
  if (result.actionItems.length === 0) {
    lines.push("- None stated");
  } else {
    for (const item of result.actionItems) {
      const meta = [item.owner ? `owner: ${item.owner}` : null, item.deadline ? `due: ${item.deadline}` : null]
        .filter(Boolean)
        .join(" · ");
      lines.push(`- ${item.task}${meta ? ` (${meta})` : ""}`);
    }
  }
  return lines.join("\n");
}

function SummariserPage() {
  const run = useServerFn(summariseMeetingNotes);
  const { logActivity } = useActivity();
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [result, setResult] = useState<MeetingSummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const parsed = notesInputSchema.safeParse({ notes });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Please paste your meeting notes.");
      return;
    }
    setFieldError("");
    setLoading(true);
    setError(null);
    try {
      const output = await run({ data: parsed.data });
      setResult(output);
      logActivity({
        kind: "summary",
        title: "Meeting notes summarised",
        detail: `${output.keyDecisions.length} decisions · ${output.actionItems.length} action items`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summarising failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setNotes("");
    setResult(null);
    setError(null);
    setFieldError("");
  }

  return (
    <AppShell
      title="Meeting Notes Summariser"
      description="Summaries, decisions and action items — taken only from what you paste."
      actions={
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <Trash2 className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5" aria-label="Meeting notes input">
          <p className="label-eyebrow">Step 1 — Paste your notes</p>
          <div className="mt-4 space-y-3">
            <Label htmlFor="notes" className="sr-only">
              Meeting notes
            </Label>
            <Textarea
              id="notes"
              rows={18}
              placeholder="Paste raw notes or a transcript here. Include names and dates if you want owners and deadlines extracted."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setFieldError("");
              }}
              aria-invalid={Boolean(fieldError)}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{notes.trim().split(/\s+/).filter(Boolean).length} words</span>
              {fieldError ? <span className="text-destructive">{fieldError}</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Wand2 className="size-4" aria-hidden />
                )}
                {loading ? "Summarising…" : "Summarise"}
              </Button>
              {result && !loading ? (
                <Button variant="outline" onClick={submit}>
                  <RefreshCw className="size-3.5" aria-hidden />
                  Regenerate
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="panel flex flex-col p-5" aria-label="Summary output">
          <div className="flex items-center justify-between gap-2">
            <p className="label-eyebrow">Step 2 — Extracted output</p>
            {result && !loading ? <CopyButton value={toPlainText(result)} label="Copy all" /> : null}
          </div>

          <div className="mt-4 flex-1 space-y-5">
            {loading ? <LoadingLines lines={8} /> : null}
            {!loading && error ? <ErrorState message={error} onRetry={submit} /> : null}
            {!loading && !error && !result ? (
              <EmptyState
                icon={<NotebookPen className="size-5" aria-hidden />}
                title="Nothing summarised yet"
                description="Paste your notes on the left. The AI will only use what appears in them."
              />
            ) : null}

            {!loading && result ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-semibold">Summary</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
                </div>

                <div>
                  <h2 className="text-sm font-semibold">Key decisions</h2>
                  {result.keyDecisions.length ? (
                    <ul className="mt-2 space-y-2">
                      {result.keyDecisions.map((decision) => (
                        <li
                          key={decision}
                          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                        >
                          {decision}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No decisions were stated in these notes.
                    </p>
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-semibold">Action items</h2>
                  {result.actionItems.length ? (
                    <ul className="mt-2 space-y-2">
                      {result.actionItems.map((item) => (
                        <li key={item.task} className="rounded-lg border border-border bg-card px-3 py-2.5">
                          <p className="text-sm font-medium">{item.task}</p>
                          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <User className="size-3.5" aria-hidden />
                              {item.owner ?? "Owner not mentioned"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="size-3.5" aria-hidden />
                              {item.deadline ?? "Deadline not mentioned"}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No action items were stated in these notes.
                    </p>
                  )}
                </div>

                <MissingInfo items={result.missingInformation} />
              </div>
            ) : null}
          </div>

          <ReviewNotice className="mt-5" />
        </section>
      </div>
    </AppShell>
  );
}
