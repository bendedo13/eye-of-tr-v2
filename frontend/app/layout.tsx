import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FaceSeek - Facial Search Engine for Professionals",
  description: "Advanced AI-powered facial recognition search platform for OSINT researchers, investigative journalists, and security professionals.",
};

// Root layout - minimal structure
// Actual app layout is in app/[locale]/layout.tsx
// Middleware handles locale detection and routing
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
