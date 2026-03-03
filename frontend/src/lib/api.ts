import OpenAI from "openai";

export const MODEL_NAME = "SmolLM2-360M-Instruct";

const BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export const openaiClient = new OpenAI({
  baseURL: `${BASE}/v1`,
  apiKey: "not-needed",
  dangerouslyAllowBrowser: true,
});

export function createConversation(): string {
  return crypto.randomUUID();
}
