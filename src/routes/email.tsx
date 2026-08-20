import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Mail, RefreshCw, Sparkles, Trash2, Pencil, Save } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail } from "@/lib/ai.functions";
import { emailInputSchema, type EmailResult, type EmailTone } from "@/lib/ai-schemas";
import { useActivity } from "@/lib/activity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — WorkFlow AI" },
      {
        name: "description",
        content:
          "Draft professional workplace emails in seconds. Choose a formal, friendly or persuasive tone and edit before sending.",
      },
      { property: "og:title", content: "Smart Email Generator — WorkFlow AI" },
      {
        property: "og:description",
        content: "Turn a purpose and a few key points into a polished workplace email.",
      },
    ],
  }),
  component: EmailPage,
});

const TONES: { value: EmailTone; label: string; hint: string }[] = [
  { value: "formal", label: "Formal", hint: "Precise and courteous" },
  { value: "friendly", label: "Friendly", hint: "Warm and approachable" },
  { value: "persuasive", label: "Persuasive", hint: "Confident, benefit-led" },
];

const EMPTY_FORM = {
  purpose: "",
  recipient: "",
  keyPoints: "",
  instructions: "",
  tone: "formal" as EmailTone,
};

function EmailPage() {
  const run = useServerFn(generateEmail);
  const { logActivity } = useActivity();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EmailResult | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function submit() {
    const parsed = emailInputSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    setError(null);
    setEditing(false);
    try {
      const output = await run({ data: parsed.data });
      setResult(output);
      setDraft(output.body ?? "");
      logActivity({
        kind: "email",
        title: output.subject || "Email drafted",
        detail: `${form.tone} tone · ${form.recipient}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setForm(EMPTY_FORM);
    setResult(null);
    setDraft("");
    setError(null);
    setErrors({});
    setEditing(false);
  }

  const fullEmail = result ? `Subject: ${result.subject}\n\n${draft}` : "";

  return (
    <AppShell
      title="Smart Email Generator"
      description="Turn a purpose and a few key points into a professional email."
      actions={
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <Trash2 className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5" aria-label="Email details">
          <p className="label-eyebrow">Step 1 — Your input</p>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Email purpose</Label>
              <Input
                id="purpose"
                placeholder="Request a deadline extension for the Q3 report"
                value={form.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                aria-invalid={Boolean(errors["purpose"])}
              />
              {errors["purpose"] ? (
                <p className="text-xs text-destructive">{errors["purpose"]}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipient">Recipient / context</Label>
              <Input
                id="recipient"
                placeholder="My line manager, who is aware of the delay"
                value={form.recipient}
                onChange={(e) => update("recipient", e.target.value)}
                aria-invalid={Boolean(errors["recipient"])}
              />
              {errors["recipient"] ? (
                <p className="text-xs text-destructive">{errors["recipient"]}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="keyPoints">Key points</Label>
              <Textarea
                id="keyPoints"
                rows={5}
                placeholder={"Two suppliers delivered late\nDraft is 80% complete\nProposing Friday 14:00 instead"}
                value={form.keyPoints}
                onChange={(e) => update("keyPoints", e.target.value)}
                aria-invalid={Boolean(errors["keyPoints"])}
              />
              {errors["keyPoints"] ? (
                <p className="text-xs text-destructive">{errors["keyPoints"]}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instructions">Additional instructions (optional)</Label>
              <Textarea
                id="instructions"
                rows={2}
                placeholder="Keep it under 150 words. Mention I'll follow up on Monday."
                value={form.instructions}
                onChange={(e) => update("instructions", e.target.value)}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Tone</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {TONES.map((tone) => {
                  const active = form.tone === tone.value;
                  return (
                    <button
                      key={tone.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update("tone", tone.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/8 text-foreground"
                          : "border-border bg-surface text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      <span className="block text-sm font-semibold">{tone.label}</span>
                      <span className="block text-[11px]">{tone.hint}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <Button className="w-full" onClick={submit} disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              {loading ? "Generating…" : "Generate email"}
            </Button>
          </div>
        </section>

        <section className="panel flex flex-col p-5" aria-label="Generated email">
          <div className="flex items-center justify-between gap-2">
            <p className="label-eyebrow">Step 2 — AI draft</p>
            {result && !loading ? (
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton value={fullEmail} />
                <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
                  {editing ? (
                    <Save className="size-3.5" aria-hidden />
                  ) : (
                    <Pencil className="size-3.5" aria-hidden />
                  )}
                  {editing ? "Done" : "Edit"}
                </Button>
                <Button variant="outline" size="sm" onClick={submit}>
                  <RefreshCw className="size-3.5" aria-hidden />
                  Regenerate
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex-1 space-y-4">
            {loading ? <LoadingLines lines={7} /> : null}

            {!loading && error ? <ErrorState message={error} onRetry={submit} /> : null}

            {!loading && !error && !result ? (
              <EmptyState
                icon={<Mail className="size-5" aria-hidden />}
                title="No draft yet"
                description="Fill in the details and generate a draft. Nothing is sent anywhere — you stay in control."
              />
            ) : null}

            {!loading && result ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="label-eyebrow">Subject</p>
                  <p className="mt-1 text-sm font-semibold">{result.subject}</p>
                </div>

                {editing ? (
                  <Textarea
                    rows={16}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    aria-label="Edit email body"
                    className="font-sans text-sm"
                  />
                ) : (
                  <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm leading-relaxed">
                    {draft}
                  </div>
                )}

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
