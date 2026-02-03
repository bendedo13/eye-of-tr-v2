import LegalLayout from "../../../legal_layout_provider";

import { use } from "react";

export default function DisclaimerPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    return (
        <LegalLayout>
            <div className="space-y-10">
                <section>
                    <h1>Disclaimer: Facial Recognition Search Limitations</h1>
                    <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-6">Last Updated: February 3, 2026</p>
                    <p>
                        FaceSeek is an advanced facial search engine and image intelligence platform designed to assist professionals with OSINT research and identification tasks. However, it is critical that users understand the limitations, risks, and proper use of facial recognition technology before relying on search results.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">1. AI FACIAL RECOGNITION ACCURACY LIMITATIONS</h2>
                    <p>
                        While FaceSeek employs state-of-the-art AI facial recognition algorithms, no facial search engine can guarantee 100% accuracy. Users must understand:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-500">
                        <li><strong>False Positives:</strong> Our facial search may return matches that appear visually similar but are not the same person. Facial recognition algorithms can be affected by image quality, lighting, age differences, and facial expressions.</li>
                        <li><strong>False Negatives:</strong> The facial search engine may fail to identify matches that exist in public databases due to image resolution, angle variations, or incomplete indexing.</li>
                        <li><strong>Algorithm Limitations:</strong> AI facial recognition is probabilistic, not deterministic. Confidence scores indicate likelihood, not certainty.</li>
                        <li><strong>Database Coverage:</strong> FaceSeek searches publicly indexed web data. Images not indexed by search engines (Google, Bing, Yandex) will not appear in results.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">2. NOT A SUBSTITUTE FOR PROFESSIONAL VERIFICATION</h2>
                    <p>
                        FaceSeek is an investigative assist tool for facial intelligence research. It is NOT:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-500">
                        <li><strong>Legal Evidence:</strong> Facial search results are not admissible as standalone legal proof without independent verification.</li>
                        <li><strong>Law Enforcement Tool:</strong> FaceSeek is not affiliated with any law enforcement agency and does not access restricted databases.</li>
                        <li><strong>Identity Verification System:</strong> Our facial recognition search should not be used for KYC (Know Your Customer), employment screening, or official identity verification without additional verification methods.</li>
                        <li><strong>Medical or Forensic Analysis:</strong> FaceSeek does not provide medical, forensic, or expert witness services.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">3. LOCATION INTELLIGENCE (PREDICTIVE) LIMITATIONS</h2>
                    <p>
                        FaceSeek Location Intelligence generates predictive location estimates by analyzing environmental cues in an image (architecture, vegetation, climate traces, terrain, signage presence, and urban density). This feature does not provide certainty and must not be treated as verified geolocation.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-500">
                        <li><strong>Predictions, not facts:</strong> Results may be incomplete, wrong, or misleading due to image quality, framing, indoor scenes, staged scenes, or AI-generated content.</li>
                        <li><strong>No user-upload image storage:</strong> We do not store uploaded images for this feature; processing is performed only to fulfill your request.</li>
                        <li><strong>User consent required:</strong> Analysis cannot be started unless you explicitly accept the required consent statement in the interface.</li>
                        <li><strong>Liability:</strong> You are solely responsible for verifying outcomes and for any actions taken based on the results.</li>
                    </ul>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed text-amber-200">
                            <strong>MANDATORY NOTICE:</strong> Bu sonuçlar yapay zekâ tarafından üretilmiş tahminlerdir. Kesinlik içermez. Tüm hukuki ve fiili sorumluluk kullanıcıya aittir.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">3. USER RESPONSIBILITY & ETHICAL USE</h2>
                    <p>
                        Users of our facial search engine are solely responsible for:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-500">
                        <li><strong>Verification:</strong> Independently verifying facial recognition results before taking action based on them.</li>
                        <li><strong>Legal Compliance:</strong> Ensuring their use of facial search technology complies with local laws, GDPR, KVKK, and applicable privacy regulations.</li>
                        <li><strong>Ethical Standards:</strong> Using image intelligence responsibly and not for harassment, stalking, discrimination, or unlawful surveillance.</li>
                        <li><strong>Consequences:</strong> Any decisions, actions, or outcomes resulting from facial search results.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">4. NO WARRANTIES OR GUARANTEES</h2>
                    <p>
                        FaceSeek provides facial recognition search services "AS IS" without warranties of any kind, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-500">
                        <li>No guarantee of accuracy, completeness, or reliability of facial search results.</li>
                        <li>No warranty that the facial search engine will be error-free, uninterrupted, or secure.</li>
                        <li>No guarantee that image intelligence data will be current, up-to-date, or comprehensive.</li>
                        <li>No warranty regarding third-party data sources (Google, Bing, Yandex, OSINT databases).</li>
                    </ul>
                </section>

                <section className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                        <strong>CRITICAL NOTICE:</strong> FaceSeek is a technology platform, not a verification authority. Always conduct independent verification before making decisions based on facial recognition search results. Misuse of facial search technology may violate privacy laws and result in legal consequences.
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
