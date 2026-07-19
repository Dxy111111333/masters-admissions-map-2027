import { NextRequest, NextResponse } from "next/server";
import hongKong from "../../../content/regions/香港.html?raw";
import macau from "../../../content/regions/澳门.html?raw";
import unitedKingdom from "../../../content/regions/英国.html?raw";
import newZealand from "../../../content/regions/新西兰.html?raw";
import greaterBay from "../../../content/regions/湾区校区.html?raw";

const pages: Record<string, string> = {
  "香港.html": hongKong,
  "澳门.html": macau,
  "英国.html": unitedKingdom,
  "新西兰.html": newZealand,
  "湾区校区.html": greaterBay,
};

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (slug === "index.html") return NextResponse.redirect(new URL("/", request.url), 302);

  const page = pages[slug];
  if (!page) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(page, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
