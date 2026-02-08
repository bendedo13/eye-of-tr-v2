import { use } from "react";
import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title = locale === "tr"
    ? "FaceSeek - KVKK Uyumlu Yapay Zeka Y?z Arama Motoru"
    : "FaceSeek - Advanced AI Facial Recognition Search Engine";

  const description = locale === "tr"
    ? "T?rkiye'nin en geli?mi?, KVKK uyumlu y?z tan?ma ve OSINT arama motoru. Biyometrik verilerinizi saklamadan g?venli arama yap?n."
    : "World's leading AI-powered facial search engine. Secure, private, and GDPR-compliant facial recognition for open source intelligence.";

  return {
    title,
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      apple: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale,
      siteName: "FaceSeek",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      languages: {
        en: "/en",
        tr: "/tr",
      },
    },
  };
}

export default function Home({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "FaceSeek",
            url: "https://face-seek.com",
            potentialAction: {
              "@type": "SearchAction",
              target: `https://face-seek.com/${locale}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
            description: locale === "tr" ? "KVKK Uyumlu Y?z Arama Motoru" : "AI Facial Search Engine",
          }),
        }}
      />
      <HomeClient locale={locale} />
    </>
  );
}
