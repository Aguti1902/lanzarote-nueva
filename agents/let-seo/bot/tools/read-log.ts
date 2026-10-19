import { defineTool } from "@cursor/bdk/tools";

const KEY = "seo-journal";

export default defineTool({
  description: "Lee el diario SEO ya guardado. No inventa cifras que no estén en el diario.",
  effect: "read",
  async execute(_input, ctx) {
    const value = await ctx.host.kv.get(KEY);
    const entries = Array.isArray(value) ? value : [];
    return { count: entries.length, entries: entries.slice(-45) };
  },
});
