import type { Metadata } from "next";
import "../globals.css";
import { Providers } from "@/app/providers";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    // Validate locale
    if (!locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client side
    const messages = await getMessages({ locale });

    return (
        <NextIntlClientProvider messages={messages}>
            <Providers>
                {children}
            </Providers>
        </NextIntlClientProvider>
    );
}
