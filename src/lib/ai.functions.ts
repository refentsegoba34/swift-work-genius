import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const toneSchema = z.enum(["formal", "friendly", "persuasive"]);

const emailInput = z.object({
  purpose: z.string().trim().min(3, "Describe the purpose of the email."),
  recipient: z.string().trim().min(2, "Add the recipient or context."),
  keyPoints: z.string().trim().min(5, "Add at least one key point."),
  instructions: z.string().trim().max(1000).optional().default(""),
  tone: toneSchema,
});

const notesInput = z.object({
  notes: z.string().trim().min(40, "Paste at least a few lines of meeting notes."),
});

const taskSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  priority: z.enum(["high", "medium", "low"]),
  deadline: z.string().trim(),
  durationMinutes: z.number().int().positive().max(24 * 60),
  notes: z.string().trim().optional().default(""),
});

const scheduleInput = z.object({
  tasks: z.array(taskSchema).min(1, "Add at least one task."),
  range: z.enum(["daily", "weekly"]),
  startDate: z.string().trim().min(4),
  workdayStart: z.string().trim().default("09:00"),
  workdayEnd: z.string().trim().default("17:00"),
});

export type EmailTone = z.infer<typeof toneSchema>;
export type PlannerTask = z.infer<typeof taskSchema>;

export type EmailResult = {
  subject: string;
  body: string;
  missingInformation: string[];
};

export type MeetingSummaryResult = {
  summary: string;
  keyDecisions: string[];
  actionItems: { task: string; owner: string | null; deadline: string | null }[];
  missingInformation: string[];
};

export type ScheduleResult = {
  overview: string;
  blocks: {
    day: string;
    date: string;
    start: string;
    end: string;
    task: string;
    priority: "high" | "medium" | "low";
    durationMinutes: number;
    reason: string;
  }[];
  unscheduled: { task: string; reason: string }[];
  missingInformation: string[];
};

const RESPONSIBLE_AI_RULES = `Responsible AI rules you must obey:
- Use ONLY information supplied by the user. Never invent facts, names, people, numbers, decisions, owners or deadlines.
- If something important is missing, leave the field null/empty and list it in "missingInformation" as a short, plain-language note.
- Never add placeholder names such as "John Doe". If a name is not supplied, write nothing for it.
- Respond with a single valid JSON object and nothing else. No markdown fences, no commentary.`;

async function runAi(system: string, prompt: string) {
  const { createLovableAiGatewayProvider, AI_MODEL, parseJsonOutput, aiErrorMessage } =
    await import("./ai-gateway.server");
  const { streamText } = await import("ai");

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  try {
    const gateway = createLovableAiGatewayProvider(apiKey);
    const result = streamText({
      model: gateway(AI_MODEL),
      system,
      prompt,
      temperature: 0.4,
    });
    const text = await result.text;
    return parseJsonOutput<unknown>(text);
  } catch (error) {
    throw new Error(aiErrorMessage(error));
  }
}

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => emailInput.parse(input))
  .handler(async ({ data }) => {
    const system = `You are an assistant that writes professional workplace emails.
Tone requested: ${data.tone}.
- formal: precise, courteous, no contractions, business register.
- friendly: warm, approachable, natural contractions, still professional.
- persuasive: confident, benefit-led, clear call to action, respectful.
Write a clear subject line and a well-structured email body (greeting, short paragraphs, closing). Do not sign off with a fabricated name; end with "Kind regards," and nothing after it unless the user supplied a sender name.
${RESPONSIBLE_AI_RULES}
JSON shape: {"subject": string, "body": string, "missingInformation": string[]}`;

    const prompt = `Purpose: ${data.purpose}
Recipient / context: ${data.recipient}
Key points to cover:
${data.keyPoints}
Additional instructions: ${data.instructions || "(none)"}`;

    return (await runAi(system, prompt)) as EmailResult;
  });

export const summariseMeetingNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => notesInput.parse(input))
  .handler(async ({ data }) => {
    const system = `You summarise workplace meeting notes with strict fidelity to the source text.
Extract: a concise summary (2-4 sentences), key decisions actually stated, and action items.
For each action item include the responsible person ONLY if a name or role is mentioned in the notes (otherwise null), and a deadline ONLY if a date or timeframe is mentioned (otherwise null).
If the notes contain no decisions or no action items, return empty arrays — do not invent any.
${RESPONSIBLE_AI_RULES}
JSON shape: {"summary": string, "keyDecisions": string[], "actionItems": [{"task": string, "owner": string|null, "deadline": string|null}], "missingInformation": string[]}`;

    return (await runAi(system, `Meeting notes:\n"""\n${data.notes}\n"""`)) as MeetingSummaryResult;
  });

export const generateSchedule = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => scheduleInput.parse(input))
  .handler(async ({ data }) => {
    const horizon = data.range === "daily" ? "a single working day" : "a working week (Monday to Friday)";
    const system = `You are a scheduling assistant. Build a realistic ${horizon} schedule from the user's task list.
Rules:
- Order tasks by urgency: earliest deadline first, then priority (high > medium > low), then longer durations earlier in the day when energy is highest.
- Blocks must never overlap. Respect the working hours provided. Insert short gaps only if needed to keep blocks tidy.
- Respect each task's estimated duration exactly. If a task cannot fit before its deadline or within the horizon, put it in "unscheduled" with a clear reason.
- Use 24-hour times (HH:MM). "day" is the weekday name, "date" is YYYY-MM-DD.
- "reason" is one short sentence explaining why the task sits at that time.
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

    return (await runAi(system, prompt)) as ScheduleResult;
  });
