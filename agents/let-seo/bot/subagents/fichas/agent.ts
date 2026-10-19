import { defineAgent } from "@cursor/bdk";

export default defineAgent({
  description:
    "Redacta título, descripción y primer párrafo de una ficha en español, inglés y alemán, sin cambiar la URL.",
  model: {
    id: "grok-4.5",
    params: [
      { id: "effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
});
