import { NextResponse } from "next/server";
import { getTransferSlugMap } from "@/lib/transfer-seo";
import { getStaticTransferSlugs } from "@/i18n/transfer-paths";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/** Slugs públicos de traslados para middleware / clients. */
export async function GET() {
  try {
    const transfers = await getTransferSlugMap();
    return NextResponse.json(
      { transfers },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json({ transfers: getStaticTransferSlugs() });
  }
}
