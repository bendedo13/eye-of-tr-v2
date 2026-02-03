import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ["en", "tr"],

    // Used when no locale matches
    defaultLocale: "en",

    // Always use locale prefix
    localePrefix: "always",
});

export default function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const adminPrefixed = pathname.match(/^\/(en|tr)\/admin(\/.*)?$/);
    if (adminPrefixed) {
        const nextUrl = request.nextUrl.clone();
        nextUrl.pathname = `/admin${adminPrefixed[2] || ""}`;
        return NextResponse.redirect(nextUrl);
    }

    return intlMiddleware(request);
}

export const config = {
    // Match only internationalized pathnames
    matcher: [
        // Match all pathnames except for
        // - … if they start with `/api`, `/_next`, `/_vercel` or `/admin`
        // - … the ones containing a dot (e.g. `favicon.ico`)
        "/((?!api|_next|_vercel|admin|.*\\..*).*)",
    ]
};
