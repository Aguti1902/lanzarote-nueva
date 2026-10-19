import { defineAgent } from "@cursor/bdk";

export default defineAgent({
  description:
    "Hace cada día un paso del SEO de Lanzarote Experience Tours y deja el resto en borrador para una persona.",
  model: {
    id: "grok-4.5",
    params: [
      { id: "effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
  hosting: {
    egressDomains: [
      "www.lanzaroteexperiencetours.com",
      "lanzaroteexperiencetours.com",
      "www.excursioneslanzarote.com",
      "excursioneslanzarote.com",
      "lanzaroteactive.com",
    ],
  },
});
