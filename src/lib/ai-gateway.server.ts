import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Server-only Lovable AI Gateway provider.
 * The API key never leaves the server.
 */
export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export const AI_MODEL = "google/gemini-3-flash-preview";

/** Extracts the first JSON object from a model response, tolerating code fences. */
export function parseJsonOutput<T>(raw: string): T {
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

export function aiErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/402/.test(message)) {
    return "AI credits have run out for this workspace. Add credits in Lovable to continue.";
  }
  if (/403/.test(message)) {
    return "AI access is currently blocked by a workspace policy. Contact your workspace admin.";
  }
  if (/429/.test(message)) {
    return "The AI service is busy right now. Please wait a moment and try again.";
  }
  return message || "Something went wrong while generating. Please try again.";
}
