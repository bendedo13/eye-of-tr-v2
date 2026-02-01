"use client";

import { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";

/**
 * Privacy Policy Page - Faceseek.com Gizlilik Politikası
 * 
 * SEO: GDPR-compliant privacy policy with detailed data handling practices
 */
export default function PrivacyPage() {
  const lastUpdated = "January 2026";

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-black mb-6">Privacy Policy</h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Your privacy is our priority. Learn how we collect, use, and protect your data.
            </p>
            <p className="text-sm text-indigo-200 mt-4">Last Updated: {lastUpdated}</p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Introduction */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">📋</span>
                <h2 className="text-3xl font-bold text-gray-800">Introduction</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                Welcome to <span className="font-semibold text-indigo-600">Faceseek.com</span>. We are committed to 
                protecting your personal information and your right to privacy. This Privacy Policy explains what 
                information we collect, how we use it, and what rights you have in relation to it.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                This policy applies to all information collected through our website, services, and any related 
                applications. By using Faceseek.com, you agree to the collection and use of information in accordance 
                with this policy.
              </p>
            </div>
          </section>

          {/* GDPR Compliance */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🇪🇺</span>
                <h2 className="text-3xl font-bold text-gray-800">GDPR Compliance</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                Faceseek.com is fully compliant with the General Data Protection Regulation (GDPR) and other 
                international privacy laws. We respect your rights regarding your personal data and provide you 
                with full control over your information.
              </p>
              <div className="bg-indigo-50 rounded-2xl p-6 mt-4">
                <h3 className="text-xl font-bold text-indigo-900 mb-3">Your GDPR Rights</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1 font-bold">•</span>
                    <span><strong>Right to Access:</strong> Request copies of your personal data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1 font-bold">•</span>
                    <span><strong>Right to Rectification:</strong> Request correction of inaccurate data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1 font-bold">•</span>
                    <span><strong>Right to Erasure:</strong> Request deletion of your personal data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1 font-bold">•</span>
                    <span><strong>Right to Restrict Processing:</strong> Request limited use of your data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1 font-bold">•</span>
                    <span><strong>Right to Data Portability:</strong> Receive your data in a structured format</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1 font-bold">•</span>
                    <span><strong>Right to Object:</strong> Object to processing of your personal data</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Collection */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">📊</span>
                <h2 className="text-3xl font-bold text-gray-800">What Data We Collect</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">1. Account Information</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Email address (required for account creation)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Username and password (encrypted)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Profile information (optional)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">2. Usage Data</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Search queries and investigation history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Uploaded images (temporarily stored for processing)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Feature usage statistics and analytics</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">3. Technical Data</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>IP address and device information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Browser type and operating system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Cookies and tracking technologies</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🎯</span>
                <h2 className="text-3xl font-bold text-gray-800">How We Use Your Data</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  We use the collected data for the following purposes:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold mt-1">✓</span>
                    <span><strong>Service Provision:</strong> To provide, maintain, and improve our facial recognition and OSINT services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold mt-1">✓</span>
                    <span><strong>Account Management:</strong> To manage your account, authentication, and user preferences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold mt-1">✓</span>
                    <span><strong>Communication:</strong> To send service updates, security alerts, and support messages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold mt-1">✓</span>
                    <span><strong>Analytics:</strong> To analyze usage patterns and improve user experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold mt-1">✓</span>
                    <span><strong>Security:</strong> To detect, prevent, and address security incidents and fraud</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold mt-1">✓</span>
                    <span><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Storage */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">💾</span>
                <h2 className="text-3xl font-bold text-gray-800">Data Storage & Retention</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                Your data is stored on secure servers with industry-standard encryption. We implement strict 
                access controls and regular security audits to protect your information.
              </p>
              <div className="bg-indigo-50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-indigo-900 mb-3">Retention Periods</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600">•</span>
                    <span><strong>Account Data:</strong> Retained until account deletion request</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600">•</span>
                    <span><strong>Search History:</strong> Retained for 12 months unless deleted by user</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600">•</span>
                    <span><strong>Uploaded Images:</strong> Automatically deleted after processing (24-48 hours)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600">•</span>
                    <span><strong>Logs & Analytics:</strong> Retained for 6 months for security purposes</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Third-Party Sharing */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🤝</span>
                <h2 className="text-3xl font-bold text-gray-800">Third-Party Data Sharing</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                We do <strong className="text-indigo-600">NOT</strong> sell your personal data to third parties. 
                We only share data in the following limited circumstances:
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Service Providers</h3>
                  <p className="text-gray-700">
                    Trusted partners who assist in operating our services (e.g., cloud hosting, email services) 
                    under strict confidentiality agreements.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Legal Requirements</h3>
                  <p className="text-gray-700">
                    When required by law, court order, or government regulations to disclose information.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Business Transfers</h3>
                  <p className="text-gray-700">
                    In the event of a merger, acquisition, or asset sale, your data may be transferred 
                    with prior notice to you.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🍪</span>
                <h2 className="text-3xl font-bold text-gray-800">Cookies & Tracking</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage, 
                and provide personalized content. You can control cookie settings through your browser preferences.
              </p>
              <div className="bg-indigo-50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-indigo-900 mb-3">Types of Cookies We Use</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
                  <li><strong>Performance Cookies:</strong> Help us understand how visitors use the site</li>
                  <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
                  <li><strong>Analytics Cookies:</strong> Collect anonymous usage statistics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">👶</span>
                <h2 className="text-3xl font-bold text-gray-800">Children's Privacy</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Faceseek.com is not intended for children under the age of 18. We do not knowingly collect 
                personal information from children. If you believe we have inadvertently collected data from 
                a child, please contact us immediately at <a href="mailto:privacy@faceseek.com" className="text-indigo-600 hover:underline">privacy@faceseek.com</a>.
              </p>
            </div>
          </section>

          {/* Contact & Updates */}
          <section>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-4">Questions About Privacy?</h2>
                <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
                  We regularly review and update this privacy policy. For questions, concerns, or to exercise 
                  your data rights, please contact our Data Protection Officer.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <a
                  href="mailto:privacy@faceseek.com"
                  className="bg-white text-indigo-600 font-bold py-3 px-6 rounded-xl hover:bg-indigo-50 transition-colors text-center"
                >
                  📧 privacy@faceseek.com
                </a>
                <a
                  href="mailto:dpo@faceseek.com"
                  className="bg-white text-indigo-600 font-bold py-3 px-6 rounded-xl hover:bg-indigo-50 transition-colors text-center"
                >
                  👤 Data Protection Officer
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ClientOnly>
  );
}
