import { defineTool } from "@cursor/bdk/tools";
import { COMPETITOR_URLS } from "../lib/program.js";

function field(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return (match?.[1] ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

async function snapshot(url: string): Promise<{
  url: string;
  ok: boolean;
  status: number;
  title: string;
  description: string;
  error: string;
}> {
  if (!COMPETITOR_URLS.includes(url)) {
    return { url, ok: false, status: 0, title: "", description: "", error: "URL fuera de la lista permitida" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "LanzaroteExperienceTours-SEO/1.0" },
    });
    const html = (await response.text()).slice(0, 200_000);
    return {
      url,
      ok: response.ok,
      status: response.status,
      title: field(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      description: field(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
      error: "",
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      title: "",
      description: "",
      error: error instanceof Error ? error.message : "No se pudo leer",
    };
  } finally {
    clearTimeout(timer);
  }
}

export default defineTool({
  description:
    "Lee el título y la meta descripción públicos de la web propia y de competidores permitidos. No copia el resto de la página.",
  effect: "read",
  async execute() {
    const pages = [];
    for (const url of COMPETITOR_URLS) pages.push(await snapshot(url));
    return { pages };
  },
});
