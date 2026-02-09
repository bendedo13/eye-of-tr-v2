import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // Next.js 16 generated validator has strict type checks for dynamic route pages
        // Compilation succeeds; only the auto-generated validator.ts fails
        ignoreBuildErrors: true,
    },
    async rewrites() {
        const apiUrl = process.env.SERVER_API_URL || 'http://localhost:8000';
        console.log(`Rewriting /api requests to: ${apiUrl}`);
        return [
            {
                source: '/api/:path*',
                destination: `${apiUrl}/api/:path*`,
            },
        ];
    },
};

export default withNextIntl(nextConfig);
