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

export const metadata: Metadata = {
    title: "FaceSeek - Facial Search Engine for Professionals",
    description: "Advanced AI-powered facial recognition search platform for OSINT researchers, investigative journalists, and security professionals.",
};

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
        <html lang={locale}>
            <body>
                <NextIntlClientProvider messages={messages}>
                    <Providers>
                        {children}
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
