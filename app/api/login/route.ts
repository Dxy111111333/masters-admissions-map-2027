import { NextRequest, NextResponse } from "next/server";
import { isValidAccessToken, SITE_ACCESS_COOKIE, tokenForPassword } from "../../../lib/site-auth";

function safeReturnTo(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "/";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const submitted = String(form.get("password") ?? "");
  const configured = process.env.SITE_PASSWORD;
  const returnTo = safeReturnTo(form.get("returnTo"));
  if (!configured) return NextResponse.redirect(new URL("/?error=config", request.url), 303);

  const [actualToken, expectedToken] = await Promise.all([
    tokenForPassword(submitted),
    tokenForPassword(configured),
  ]);
  if (!isValidAccessToken(actualToken, expectedToken)) {
    const url = new URL("/", request.url);
    url.searchParams.set("error", "wrong");
    if (returnTo !== "/") url.searchParams.set("next", returnTo);
    return NextResponse.redirect(url, 303);
  }

  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(SITE_ACCESS_COOKIE, expectedToken, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
