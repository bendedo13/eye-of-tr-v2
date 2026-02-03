import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import en from './messages/en.json';
import tr from './messages/tr.json';

// Can be imported from a shared config
export const locales = ['en', 'tr'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
    // Fallback to default locale if not provided or invalid
    const activeLocale = locale || 'en';

    if (!locales.includes(activeLocale as Locale)) {
        notFound();
    }

    const messages = activeLocale === 'tr' ? tr : en;

    return {
        locale: activeLocale,
        messages
    };
});

// Trigger re-import of messages
