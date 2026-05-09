import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const inputSchema = z.object({
  type: z.enum(["blog", "recipe", "routine", "tip"]),
  topic: z.string().min(1).max(500),
  notes: z.string().max(2000).optional().default(""),
});

const outputSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  body: z.string().describe("Markdown body. For recipe/routine include readable formatted sections too."),
  tags: z.array(z.string()).max(8),
  data: z
    .object({
      ingredients: z.array(z.string()).optional(),
      steps: z.array(z.object({ title: z.string(), detail: z.string(), duration_min: z.number().optional() })).optional(),
      tip: z.string().optional(),
      time_total_min: z.number().optional(),
    })
    .partial(),
});

const SYSTEMS: Record<string, string> = {
  blog: "You are a warm, inclusive self-care editor for women. Write a thoughtful long-form blog article (450-700 words) with empathetic tone, concrete advice, and a soft poetic intro. Use Markdown headings (##), short paragraphs, and a closing affirmation. Suggest 4-6 lowercase tags.",
  recipe: "You are a holistic skincare formulator. Produce a safe DIY skincare recipe. Provide a short intro (body), an ingredients list (data.ingredients), and numbered steps (data.steps with title + detail). Always include a patch-test reminder in the body. 4-6 lowercase tags.",
  routine: "You are a wellness coach. Design a step-by-step routine. Each step in data.steps with title, detail, and duration_min. Set data.time_total_min. The body is a warm intro + closing reflection. 4-6 lowercase tags.",
  tip: "You are a caring self-care friend. Produce a single short, punchy actionable tip (1-3 sentences) in data.tip and mirror it in body. Title is catchy. 3-5 lowercase tags.",
};

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI is not configured. Please contact support." };
    }
    const provider = createLovableAiGatewayProvider(apiKey);
    const model = provider("openai/gpt-5-mini");

    try {
      const { experimental_output } = await generateText({
        model,
        output: Output.object({ schema: outputSchema }),
        system: SYSTEMS[data.type],
        prompt: `Topic: ${data.topic}\n\nExtra notes from the author:\n${data.notes || "(none)"}\n\nReturn the structured object.`,
      });
      return { ok: true as const, content: experimental_output };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 429) return { ok: false as const, error: "Rate limit reached. Please try again in a moment." };
      if (status === 402) return { ok: false as const, error: "AI credits exhausted. Please add credits in workspace settings." };
      return { ok: false as const, error: `AI request failed: ${msg}` };
    }
  });
