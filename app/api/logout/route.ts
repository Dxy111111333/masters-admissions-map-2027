import { NextRequest, NextResponse } from "next/server";
import { SITE_ACCESS_COOKIE } from "../../../lib/site-auth";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(SITE_ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
