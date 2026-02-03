import LegalLayout from "../../../legal_layout_provider";

export default function TermsPage() {
    return (
        <LegalLayout>
            <div className="space-y-10">
                <section>
                    <h1>Terms of Service for Facial Search Platform</h1>
                    <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-6">Effective Date: February 3, 2026</p>
                    <p>
                        Welcome to FaceSeek, the world's leading facial search engine and image intelligence platform. By accessing or using our facial recognition search services, website, API, or any related tools, you agree to be bound by these Terms of Service. If you do not agree with these terms, please discontinue use of the platform immediately.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">1. ACCEPTABLE USE OF FACIAL SEARCH ENGINE</h2>
                    <p>
                        FaceSeek provides an AI-powered facial recognition search platform for professional, ethical, and lawful use only. Our facial search engine is designed for legitimate OSINT research, investigative journalism, cybersecurity operations, and lawful identification purposes.
                    </p>
                    <p className="font-bold text-white">You explicitly agree NOT to use our facial search services for:</p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-500">
                        <li><strong>Harassment or Stalking:</strong> Using facial recognition search to intimidate, threaten, or harass individuals.</li>
                        <li><strong>Minor Identification:</strong> Searching for or identifying minors without legal guardianship or lawful authority.</li>
                        <li><strong>Illegal Surveillance:</strong> Conducting unauthorized surveillance, profiling, or tracking of individuals.</li>
                        <li><strong>Discrimination:</strong> Using image intelligence for discriminatory purposes based on race, ethnicity, religion, or protected characteristics.</li>
                        <li><strong>System Abuse:</strong> Automated scraping, reverse engineering, or attempts to overwhelm our facial search infrastructure.</li>
                        <li><strong>Impersonation:</strong> Using facial recognition results to impersonate or defraud individuals.</li>
                    </ul>
                    <p className="text-white font-bold">Violation of these terms may result in immediate account termination and legal action.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">2. ACCOUNT MANAGEMENT & CREDITS SYSTEM</h2>
                    <p>
                        To use FaceSeek's facial search engine, you must create an account and maintain accurate registration information. You are solely responsible for:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-500">
                        <li><strong>Account Security:</strong> Maintaining confidentiality of your login credentials and preventing unauthorized access.</li>
                        <li><strong>Credit Purchases:</strong> Credits purchased for facial recognition searches are non-refundable and represent a license to use our AI processing engine, not a physical product.</li>
                        <li><strong>Account Activity:</strong> All facial search activities conducted through your account, whether authorized or unauthorized.</li>
                        <li><strong>Inactive Accounts:</strong> Accounts with no activity for 12 consecutive months may be purged, including unused credits.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">3. FACIAL RECOGNITION ACCURACY & LIMITATIONS</h2>
                    <p>
                        FaceSeek uses advanced AI facial recognition algorithms to provide image intelligence services. However, you acknowledge and agree that:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-500">
                        <li><strong>AI Assistance Tool:</strong> Our facial search engine is an investigative assist tool, not a definitive legal proof or identification system.</li>
                        <li><strong>No Guarantees:</strong> We do not guarantee 100% accuracy in facial recognition matches. Results depend on image quality, database coverage, and algorithm limitations.</li>
                        <li><strong>User Verification:</strong> Users must independently verify facial search results before making decisions based on them.</li>
                        <li><strong>Public Data Only:</strong> FaceSeek searches publicly indexed web data and does not access private databases, law enforcement systems, or confidential records.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">4. LIMITATION OF LIABILITY</h2>
                    <p>
                        FaceSeek shall not be held liable for any decisions, actions, or consequences resulting from facial recognition search results. Specifically:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-500">
                        <li>We are not responsible for misidentification, false positives, or missed matches in facial search results.</li>
                        <li>FaceSeek is not liable for how users interpret or act upon image intelligence data.</li>
                        <li>We do not provide legal, investigative, or professional advice through our facial search platform.</li>
                        <li>Maximum liability is limited to the amount paid for services in the 12 months preceding any claim.</li>
                    </ul>
                    <p className="text-white font-bold">YOU USE THE FACIAL SEARCH ENGINE AT YOUR OWN RISK.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">5. INTELLECTUAL PROPERTY & DATA OWNERSHIP</h2>
                    <p>
                        FaceSeek retains all intellectual property rights to our facial recognition algorithms, AI models, platform design, and proprietary technology. Users retain ownership of images they upload but grant FaceSeek a limited license to process them for facial search purposes.
                    </p>
                </section>

                <section className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                        GOVERNING LAW: These terms are governed by the laws of the jurisdiction where FaceSeek operates. Any disputes will be settled in local courts.
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
