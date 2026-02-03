import LegalLayout from "../../../legal_layout_provider";

import { use } from "react";

export default function PrivacyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  return (
    <LegalLayout>
      <div className="space-y-10">
        <section>
          <h1>Privacy Policy for Facial Search Engine</h1>
          <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-6">Last Updated: February 3, 2026</p>
          <p>
            At FaceSeek, protecting your privacy is our highest priority. This Privacy Policy explains how our facial search engine collects, uses, processes, and safeguards data when you use our image intelligence platform and facial recognition search services. We are committed to full GDPR (General Data Protection Regulation) and KVKK (Turkish Personal Data Protection Law) compliance.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black">1. DATA COLLECTION & FACIAL RECOGNITION PROCESSING</h2>
          <p>
            FaceSeek is a facial search engine that processes publicly available data. Unlike traditional facial recognition databases, we do not maintain permanent biometric archives. Here's how we handle your facial search data:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-zinc-500">
            <li><strong>Image Uploads:</strong> When you upload an image for facial recognition search, the file is processed locally and transiently to generate a mathematical biometric vector (facial signature).</li>
            <li><strong>Temporary Storage:</strong> Uploaded images are automatically deleted after search completion or within 24 hours maximum. We do not build permanent facial recognition databases from user uploads.</li>
            <li><strong>Search Metadata:</strong> We collect anonymized search metadata (timestamp, query type, result count) for system optimization and abuse prevention, but never link this to personally identifiable information.</li>
            <li><strong>No Third-Party Sales:</strong> Your facial data, image uploads, and biometric signatures are NEVER sold, shared, or transferred to third parties for commercial purposes.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black">2. GDPR COMPLIANCE FOR FACIAL SEARCH</h2>
          <p>
            For users in the European Economic Area (EEA), FaceSeek strictly adheres to GDPR requirements for facial recognition technology and biometric data processing:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-zinc-500">
            <li><strong>Right to Access:</strong> You can request information about what personal data we process related to your facial search activities.</li>
            <li><strong>Right to Erasure:</strong> You have the right to request deletion of any cached data or search history associated with your account.</li>
            <li><strong>Right to Object:</strong> If your image appears in public web search results indexed by our facial search engine, you may object to specific indexing under GDPR Article 21.</li>
            <li><strong>Data Portability:</strong> You can request export of your account data and search history in machine-readable format.</li>
            <li><strong>Lawful Basis:</strong> We process facial recognition data based on legitimate interest (OSINT research, security) and user consent for platform services.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black">3. HOW WE USE FACIAL INTELLIGENCE DATA</h2>
          <p>
            FaceSeek uses collected information solely for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-zinc-500">
            <li><strong>Authentication & Billing:</strong> Email addresses and payment information are used for account management, subscription billing, and service notifications.</li>
            <li><strong>Facial Search Operations:</strong> Uploaded images are processed to perform reverse image face search across public web indexes (Google, Bing, Yandex, OSINT databases).</li>
            <li><strong>Algorithm Improvement:</strong> Anonymized search metadata helps improve facial recognition accuracy and system performance.</li>
            <li><strong>Security & Abuse Prevention:</strong> We monitor usage patterns to prevent platform abuse, fraudulent activities, and violations of our Terms of Service.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black">4. IMAGE DATA SECURITY & ENCRYPTION</h2>
          <p>
            FaceSeek implements industry-leading security measures to protect your facial search data:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-zinc-500">
            <li><strong>AES-256 Encryption:</strong> All data at rest is encrypted using Advanced Encryption Standard 256-bit encryption.</li>
            <li><strong>TLS/SSL Protection:</strong> Data in transit (image uploads, API requests) is protected with Transport Layer Security (TLS 1.3).</li>
            <li><strong>Zero-Knowledge Architecture:</strong> Our facial search engine processes biometric vectors without storing original images permanently.</li>
            <li><strong>Access Controls:</strong> Strict role-based access controls ensure only authorized personnel can access system infrastructure.</li>
          </ul>
        </section>

        <section className="space-y-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
          <h2 className="text-primary font-black uppercase tracking-widest text-sm">CONTACT FOR PRIVACY REQUESTS</h2>
          <p className="text-xs">
            For GDPR data requests, privacy inquiries, or to exercise your rights regarding facial recognition data processing, contact our Data Protection Officer at: <strong>privacy@face-seek.com</strong>
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
