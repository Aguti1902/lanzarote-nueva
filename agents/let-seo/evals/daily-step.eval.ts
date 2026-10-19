import { defineEval } from "@cursor/bdk/evals";

export default defineEval({
  tags: ["smoke"],
  cases: [
    {
      id: "solo-el-paso",
      description: "El día empieza leyendo el calendario y no guarda nada si se le pide no guardar.",
      async test(t) {
        await t.send("Qué trabajo SEO toca hoy? No guardes nada.");
        t.succeeded();
        t.calledTool("today-step");
        t.notCalledTool("save-daily-log");
      },
    },
  ],
});
