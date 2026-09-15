import { NextResponse } from "next/server";
import { getAdminPassword } from "@/lib/admin-auth";

export async function GET() {
  const pwd = getAdminPassword();
  return NextResponse.json({
    length: pwd.length,
    first10: pwd.substring(0, 10),
    last10: pwd.substring(pwd.length - 10),
  });
}
