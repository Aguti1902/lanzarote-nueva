import { defineAgent } from "@cursor/bdk";

export default defineAgent({
  description:
    "Escribe el informe SEO de una página a partir del diario, sin cifras inventadas.",
  model: {
    id: "grok-4.5",
    params: [
      { id: "effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
});
