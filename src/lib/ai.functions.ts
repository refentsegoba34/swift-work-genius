import { createServerFn } from "@tanstack/react-start";
import { emailInputSchema, notesInputSchema, scheduleInputSchema } from "./ai-schemas";
import type { EmailResult, MeetingSummaryResult, ScheduleResult } from "./ai-schemas";

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => emailInputSchema.parse(input))
  .handler(async ({ data }): Promise<EmailResult> => {
    const { runEmail } = await import("./ai-runtime.server");
    return runEmail(data);
  });

export const summariseMeetingNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => notesInputSchema.parse(input))
  .handler(async ({ data }): Promise<MeetingSummaryResult> => {
    const { runSummary } = await import("./ai-runtime.server");
    return runSummary(data);
  });

export const generateSchedule = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => scheduleInputSchema.parse(input))
  .handler(async ({ data }): Promise<ScheduleResult> => {
    const { runSchedule } = await import("./ai-runtime.server");
    return runSchedule(data);
  });
