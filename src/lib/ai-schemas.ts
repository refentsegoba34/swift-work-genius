import { z } from "zod";

export const toneSchema = z.enum(["formal", "friendly", "persuasive"]);

export const emailInputSchema = z.object({
  purpose: z.string().trim().min(3, "Describe the purpose of the email."),
  recipient: z.string().trim().min(2, "Add the recipient or context."),
  keyPoints: z.string().trim().min(5, "Add at least one key point."),
  instructions: z.string().trim().max(1000).optional().default(""),
  tone: toneSchema,
});

export const notesInputSchema = z.object({
  notes: z.string().trim().min(40, "Paste at least a few lines of meeting notes."),
});

export const taskSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  priority: z.enum(["high", "medium", "low"]),
  deadline: z.string().trim(),
  durationMinutes: z.number().int().positive().max(1440),
  notes: z.string().trim().optional().default(""),
});

export const scheduleInputSchema = z.object({
  tasks: z.array(taskSchema).min(1, "Add at least one task."),
  range: z.enum(["daily", "weekly"]),
  startDate: z.string().trim().min(4),
  workdayStart: z.string().trim().default("09:00"),
  workdayEnd: z.string().trim().default("17:00"),
});

export type EmailTone = z.infer<typeof toneSchema>;
export type PlannerTask = z.infer<typeof taskSchema>;
export type EmailInput = z.infer<typeof emailInputSchema>;
export type NotesInput = z.infer<typeof notesInputSchema>;
export type ScheduleInput = z.infer<typeof scheduleInputSchema>;

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

export type ScheduleBlock = {
  day: string;
  date: string;
  start: string;
  end: string;
  task: string;
  priority: "high" | "medium" | "low";
  durationMinutes: number;
  reason: string;
};

export type ScheduleResult = {
  overview: string;
  blocks: ScheduleBlock[];
  unscheduled: { task: string; reason: string }[];
  missingInformation: string[];
};

export const AI_REVIEW_NOTICE = "AI-generated content should be reviewed before use.";
