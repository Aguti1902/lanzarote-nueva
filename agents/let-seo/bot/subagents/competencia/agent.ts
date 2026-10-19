import { defineAgent } from "@cursor/bdk";

export default defineAgent({
  description:
    "Compara la ficha con webs públicas ya leídas. No inventa precios ni copia textos.",
  model: {
    id: "grok-4.5",
    params: [
      { id: "effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
});
