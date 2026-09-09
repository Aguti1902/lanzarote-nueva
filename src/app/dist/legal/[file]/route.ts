import { NextResponse } from "next/server";

const PDF_TO_PAGE: Record<string, string> = {
  "privacy-policy-es.pdf": "/es/politica-privacidad",
  "privacy-policy-en.pdf": "/en/privacy-policy",
  "privacy-policy-de.pdf": "/de/datenschutz",
  "sales-cancellation-policy-es.pdf": "/es/condiciones-contratacion",
  "sales-cancellation-policy-en.pdf": "/en/terms-and-conditions",
  "sales-cancellation-policy-de.pdf": "/de/agb",
};

export async function GET(
  request: Request,
  ctx: { params: Promise<{ file: string }> }
) {
  const { file } = await ctx.params;
  const dest = PDF_TO_PAGE[file.toLowerCase()] || "/es/aviso-legal";
  return NextResponse.redirect(new URL(dest, request.url), 301);
}
