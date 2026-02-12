import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["en", "tr"],
  defaultLocale: "en",
  localePrefix: "always",
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/@vite/client" || pathname === "/@react-refresh") {
    return new NextResponse(null, { status: 204 });
  }
  if (
    pathname.match(/^\/(en|tr)\/@vite(\/.*)?$/) ||
    pathname.match(/^\/(en|tr)\/@react-refresh(\/.*)?$/)
  ) {
    return new NextResponse(null, { status: 204 });
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
