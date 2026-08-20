import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type {
  EmailInput,
  EmailResult,
  MeetingSummaryResult,
  NotesInput,
  ScheduleInput,
  ScheduleResult,
} from "./ai-schemas";

const AI_MODEL = "google/gemini-3-flash-preview";

const RESPONSIBLE_AI_RULES = `Responsible AI rules you must obey:
- Use ONLY information supplied by the user. Never invent facts, names, people, numbers, decisions, owners or deadlines.
- If something important is missing, leave the field null or empty and add a short plain-language note to "missingInformation".
- Never use placeholder names such as "John Doe".
- Respond with a single valid JSON object and nothing else. No markdown fences, no commentary.`;

function parseJsonOutput<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("The AI response could not be read. Please try again.");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

function aiErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/\b402\b/.test(message)) {
    return "AI credits have run out for this workspace. Add credits in Lovable to continue.";
  }
  if (/\b403\b/.test(message)) {
    return "AI access is blocked by a workspace policy. Please contact your workspace admin.";
  }
  if (/\b429\b/.test(message)) {
    return "The AI service is busy right now. Please wait a moment and try again.";
  }
  return message || "Something went wrong while generating. Please try again.";
}

async function runAi<T>(system: string, prompt: string): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  try {
    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });

    const result = streamText({
      model: gateway(AI_MODEL),
      system,
      prompt,
      temperature: 0.4,
    });

    return parseJsonOutput<T>(await result.text);
  } catch (error) {
    throw new Error(aiErrorMessage(error));
  }
}

export async function runEmail(data: EmailInput): Promise<EmailResult> {
  const system = `You write professional workplace emails.
Tone requested: ${data.tone}.
- formal: precise, courteous, business register, no contractions.
- friendly: warm and approachable, natural contractions, still professional.
- persuasive: confident, benefit-led, with a clear and respectful call to action.
Produce a specific subject line and a well-structured body (greeting, short paragraphs, closing). End with "Kind regards," and do not add a fabricated sender name.
${RESPONSIBLE_AI_RULES}
JSON shape: {"subject": string, "body": string, "missingInformation": string[]}`;

  const prompt = `Purpose: ${data.purpose}
Recipient / context: ${data.recipient}
Key points to cover:
${data.keyPoints}
Additional instructions: ${data.instructions || "(none)"}`;

  return runAi<EmailResult>(system, prompt);
}

export async function runSummary(data: NotesInput): Promise<MeetingSummaryResult> {
  const system = `You summarise workplace meeting notes with strict fidelity to the source text.
Extract a concise summary (2-4 sentences), the key decisions actually stated, and the action items.
For each action item include the responsible person ONLY if a name or role appears in the notes (otherwise null), and a deadline ONLY if a date or timeframe appears in the notes (otherwise null).
If there are no decisions or no action items, return empty arrays. Never invent any.
${RESPONSIBLE_AI_RULES}
JSON shape: {"summary": string, "keyDecisions": string[], "actionItems": [{"task": string, "owner": string|null, "deadline": string|null}], "missingInformation": string[]}`;

  return runAi<MeetingSummaryResult>(system, `Meeting notes:\n"""\n${data.notes}\n"""`);
}

export async function runSchedule(data: ScheduleInput): Promise<ScheduleResult> {
  const horizon = data.range === "daily" ? "a single working day" : "a working week (Monday to Friday)";
  const system = `You are a scheduling assistant. Build a realistic schedule across ${horizon} from the user's task list.
Rules:
- Order by urgency: earliest deadline first, then priority (high > medium > low), then place longer or demanding work earlier in the day.
- Blocks must never overlap and must stay inside the working hours provided.
- Respect each task's estimated duration exactly. If a task cannot fit before its deadline or inside the horizon, list it under "unscheduled" with a clear reason.
- Use 24-hour times (HH:MM). "day" is the weekday name, "date" is YYYY-MM-DD.
- "reason" is one short sentence explaining the placement.
${RESPONSIBLE_AI_RULES}
JSON shape: {"overview": string, "blocks": [{"day": string, "date": string, "start": string, "end": string, "task": string, "priority": "high"|"medium"|"low", "durationMinutes": number, "reason": string}], "unscheduled": [{"task": string, "reason": string}], "missingInformation": string[]}`;

  const prompt = `Schedule range: ${data.range}
Start date: ${data.startDate}
Working hours: ${data.workdayStart} to ${data.workdayEnd}
Tasks:
${data.tasks
  .map(
    (t, i) =>
      `${i + 1}. ${t.name} | priority: ${t.priority} | deadline: ${t.deadline || "not given"} | duration: ${t.durationMinutes} minutes | notes: ${t.notes || "none"}`,
  )
  .join("\n")}`;

  return runAi<ScheduleResult>(system, prompt);
}
