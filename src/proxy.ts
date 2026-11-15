import { NextResponse, type NextRequest } from "next/server";

import { locales, pickLocale } from "@/i18n/config";

/** Sends requests without a locale prefix to the visitor's preferred language. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocalePrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocalePrefix) return;

  const locale = pickLocale(request.headers.get("accept-language"));
  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next internals, API routes and anything that looks like a file.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
