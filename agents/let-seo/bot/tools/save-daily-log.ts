import { defineTool } from "@cursor/bdk/tools";
import * as z from "zod/v4";
import { forbiddenReason, stepFor } from "../lib/program.js";

const KEY = "seo-journal";

export default defineTool({
  description:
    "Guarda el trabajo de hoy. Rechaza enlaces comprados, reseñas falsas, incentivos y cambios de URL. No envía correos ni publica en Google.",
  effect: "write",
  inputSchema: z.object({
    summary: z.string().min(1).max(2000),
    drafts: z.array(z.string().max(2000)).max(8),
    humanActions: z.array(z.string().max(500)).max(8),
  }),
  dryRunResult: { saved: false, dryRun: true },
  async execute({ summary, drafts, humanActions }, ctx) {
    const blob = [summary, ...drafts, ...humanActions].join("\n");
    const blocked = forbiddenReason(blob);
    if (blocked) return { saved: false, rejected: true, reason: blocked };

    const step = stepFor(ctx.now());
    const current = await ctx.host.kv.get(KEY);
    const entries = Array.isArray(current) ? current : [];
    const already = entries.find((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
      return entry.date === step.date && entry.stepId === step.kind;
    });
    if (already) return { saved: false, alreadyLogged: true, entry: already };

    const entry = {
      date: step.date,
      monthNumber: step.monthNumber,
      stepId: step.kind,
      fichaId: step.ficha.id,
      summary,
      drafts,
      humanActions,
      savedAt: ctx.now().toISOString(),
    };
    const next = [...entries, entry].slice(-400);
    await ctx.host.kv.put(KEY, next);
    return { saved: true, entry };
  },
});
