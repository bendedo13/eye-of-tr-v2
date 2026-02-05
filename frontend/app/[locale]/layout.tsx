import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { HtmlLang } from "@/components/HtmlLang";
import CookieConsent from "@/components/CookieConsent";

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    // Await params in Next.js 15
    const { locale } = await params;

    // Validate locale
    if (!locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client side
    const messages = await getMessages({ locale });

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <HtmlLang lang={locale} />
            <Providers>
                {children}
                <CookieConsent />
            </Providers>
        </NextIntlClientProvider>
    );
}
