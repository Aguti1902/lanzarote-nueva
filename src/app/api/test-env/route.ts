import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.ADMIN_PASSWORD?.trim() || "";
  let stripped = raw;
  if ((raw.startsWith('"') && raw.endsWith('"')) || 
      (raw.startsWith("'") && raw.endsWith("'"))) {
    stripped = raw.slice(1, -1);
  }
  return NextResponse.json({
    hasEnv: !!process.env.ADMIN_PASSWORD,
    rawLen: raw.length,
    strippedLen: stripped.length,
    first10: stripped.substring(0, 10),
    last10: stripped.substring(stripped.length - 10),
  });
}
