import { defineAgent } from "@cursor/bdk";

export default defineAgent({
  description:
    "Redacta el H1, el title, la descripción y el primer párrafo en español, inglés y alemán. No cambia el slug.",
  model: {
    id: "grok-4.5",
    params: [
      { id: "effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
});
