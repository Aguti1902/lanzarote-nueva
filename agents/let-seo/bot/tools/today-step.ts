import { defineTool } from "@cursor/bdk/tools";
import { CONTROL_QUERIES, stepFor, TIMANFAYA_COPY } from "../lib/program.js";

export default defineTool({
  description:
    "Devuelve el paso SEO de hoy según el calendario de la propuesta: mes, ficha, tarea y reglas. No escribe nada.",
  effect: "read",
  async execute(_input, ctx) {
    const step = stepFor(ctx.now());
    return {
      ...step,
      editable: ["h1", "title", "metaDescription", "firstParagraph", "includes", "guideLanguage"],
      slugPolicy: "frozen",
      controlQueries: step.kind === "medir" || step.kind === "abrir-mes" ? CONTROL_QUERIES : [],
      approvedTimanfayaCopy:
        step.ficha.id === "timanfaya" && (step.kind === "titulos" || step.kind === "parrafo")
          ? TIMANFAYA_COPY
          : null,
    };
  },
});
