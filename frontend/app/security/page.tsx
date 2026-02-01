"use client";

import { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";

/**
 * Security Page - Faceseek.com Güvenlik Politikası
 * 
 * SEO: Comprehensive security policy with encryption, access control, and incident response
 */
export default function SecurityPage() {
  const lastUpdated = "January 2026";

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-black mb-6">Security Policy</h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Your data security is our top priority. Learn about our comprehensive security measures.
            </p>
            <p className="text-sm text-indigo-200 mt-4">Last Updated: {lastUpdated}</p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Overview */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🛡️</span>
                <h2 className="text-3xl font-bold text-gray-800">Security Overview</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                At <span className="font-semibold text-indigo-600">Faceseek.com</span>, we implement 
                enterprise-grade security measures to protect your data from unauthorized access, disclosure, 
                alteration, and destruction. Our security framework follows industry best practices and 
                international standards.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <h3 className="font-bold text-gray-800">256-bit Encryption</h3>
                  <p className="text-sm text-gray-600 mt-1">Military-grade data protection</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-2">🔐</div>
                  <h3 className="font-bold text-gray-800">ISO 27001 Certified</h3>
                  <p className="text-sm text-gray-600 mt-1">International security standards</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-bold text-gray-800">24/7 Monitoring</h3>
                  <p className="text-sm text-gray-600 mt-1">Continuous threat detection</p>
                </div>
              </div>
            </div>
          </section>

          {/* Encryption */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🔐</span>
                <h2 className="text-3xl font-bold text-gray-800">Data Encryption</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                We use state-of-the-art encryption technologies to protect your data both in transit and at rest.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-indigo-900 mb-4">🌐 Data in Transit</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>TLS 1.3:</strong> Latest encryption protocol for all communications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>HTTPS Everywhere:</strong> All pages served over secure connections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Certificate Pinning:</strong> Protection against man-in-the-middle attacks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Perfect Forward Secrecy:</strong> Each session uses unique encryption keys</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-indigo-900 mb-4">💾 Data at Rest</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>AES-256:</strong> Industry-standard encryption for stored data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Encrypted Databases:</strong> All user data encrypted at the database level</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Secure Key Management:</strong> Keys stored in hardware security modules (HSM)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Encrypted Backups:</strong> All backup files are fully encrypted</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Access Control */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🔑</span>
                <h2 className="text-3xl font-bold text-gray-800">Access Control & Authentication</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">User Authentication</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span><strong>Strong Password Requirements:</strong> Minimum 8 characters with complexity rules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span><strong>Password Hashing:</strong> Bcrypt with salt for secure password storage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span><strong>JWT Tokens:</strong> Secure, time-limited session management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span><strong>Multi-Factor Authentication (MFA):</strong> Optional 2FA for enhanced security</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span><strong>Session Management:</strong> Automatic logout after inactivity</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Role-Based Access Control (RBAC)</h3>
                  <p className="text-gray-700 mb-3">
                    We implement strict role-based permissions to ensure users can only access data and 
                    features appropriate to their account level.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Principle of least privilege: Minimal access rights by default</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Segregation of duties: Critical operations require multiple approvals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Regular access reviews: Periodic audits of user permissions</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Administrative Access</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Limited admin accounts with mandatory MFA</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Comprehensive audit logging of all admin actions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">→</span>
                      <span>Secure privileged access management (PAM) systems</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Infrastructure Security */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🏗️</span>
                <h2 className="text-3xl font-bold text-gray-800">Infrastructure Security</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-indigo-900 mb-3">🔥 Network Security</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Enterprise-grade firewalls</li>
                    <li>• Intrusion Detection Systems (IDS)</li>
                    <li>• Intrusion Prevention Systems (IPS)</li>
                    <li>• DDoS protection and mitigation</li>
                    <li>• Network segmentation and isolation</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-indigo-900 mb-3">☁️ Cloud Security</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• AWS/Azure security best practices</li>
                    <li>• Private cloud infrastructure</li>
                    <li>• Geo-redundant data centers</li>
                    <li>• Regular security assessments</li>
                    <li>• Automated compliance monitoring</li>
                  </ul>
                </div>
                <div className="bg-purple-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-indigo-900 mb-3">🐛 Application Security</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Regular security code reviews</li>
                    <li>• Automated vulnerability scanning</li>
                    <li>• Penetration testing (quarterly)</li>
                    <li>• Secure development lifecycle (SDLC)</li>
                    <li>• OWASP Top 10 compliance</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-indigo-900 mb-3">📦 Data Protection</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Automated daily backups</li>
                    <li>• Encrypted backup storage</li>
                    <li>• Disaster recovery plan (DRP)</li>
                    <li>• Business continuity plan (BCP)</li>
                    <li>• Regular recovery testing</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Monitoring & Incident Response */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🚨</span>
                <h2 className="text-3xl font-bold text-gray-800">Security Monitoring & Incident Response</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-red-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-red-900 mb-4">24/7 Security Operations Center (SOC)</h3>
                  <p className="text-gray-700 mb-3">
                    Our dedicated security team monitors systems around the clock to detect and respond to 
                    potential threats in real-time.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      <span>Real-time threat intelligence and analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      <span>Automated alert systems for suspicious activities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      <span>Security Information and Event Management (SIEM)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      <span>Comprehensive logging and audit trails</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-orange-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-orange-900 mb-4">Incident Response Plan</h3>
                  <p className="text-gray-700 mb-3">
                    In the unlikely event of a security incident, we follow a comprehensive incident response 
                    protocol:
                  </p>
                  <div className="grid md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center">
                      <div className="bg-white rounded-xl p-4 mb-2">
                        <div className="text-3xl mb-2">🔍</div>
                        <h4 className="font-bold text-sm text-gray-800">1. Detection</h4>
                      </div>
                      <p className="text-xs text-gray-600">Immediate identification of security events</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-white rounded-xl p-4 mb-2">
                        <div className="text-3xl mb-2">🛑</div>
                        <h4 className="font-bold text-sm text-gray-800">2. Containment</h4>
                      </div>
                      <p className="text-xs text-gray-600">Isolate affected systems to prevent spread</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-white rounded-xl p-4 mb-2">
                        <div className="text-3xl mb-2">🔧</div>
                        <h4 className="font-bold text-sm text-gray-800">3. Remediation</h4>
                      </div>
                      <p className="text-xs text-gray-600">Resolve vulnerability and restore services</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-white rounded-xl p-4 mb-2">
                        <div className="text-3xl mb-2">📢</div>
                        <h4 className="font-bold text-sm text-gray-800">4. Notification</h4>
                      </div>
                      <p className="text-xs text-gray-600">Inform affected users within 72 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance & Certifications */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">📜</span>
                <h2 className="text-3xl font-bold text-gray-800">Compliance & Certifications</h2>
              </div>
              <p className="text-gray-700 text-lg mb-6">
                Faceseek.com maintains compliance with international security standards and regulations:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">🇪🇺</div>
                  <h3 className="font-bold text-gray-800 mb-2">GDPR</h3>
                  <p className="text-sm text-gray-600">EU Data Protection Regulation</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">🏆</div>
                  <h3 className="font-bold text-gray-800 mb-2">ISO 27001</h3>
                  <p className="text-sm text-gray-600">Information Security Management</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="font-bold text-gray-800 mb-2">SOC 2 Type II</h3>
                  <p className="text-sm text-gray-600">Security & Availability Controls</p>
                </div>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">👤</span>
                <h2 className="text-3xl font-bold text-gray-800">Your Security Responsibilities</h2>
              </div>
              <p className="text-gray-700 text-lg mb-4">
                Security is a shared responsibility. Here's how you can help protect your account:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-800 mb-2">✓ Use Strong Passwords</h3>
                  <p className="text-sm text-gray-600">Create unique, complex passwords and change them regularly</p>
                </div>
                <div className="bg-indigo-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-800 mb-2">✓ Enable MFA</h3>
                  <p className="text-sm text-gray-600">Add an extra layer of security with two-factor authentication</p>
                </div>
                <div className="bg-indigo-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-800 mb-2">✓ Keep Software Updated</h3>
                  <p className="text-sm text-gray-600">Ensure your browser and OS have the latest security patches</p>
                </div>
                <div className="bg-indigo-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-800 mb-2">✓ Beware of Phishing</h3>
                  <p className="text-sm text-gray-600">Never share credentials via email or suspicious links</p>
                </div>
                <div className="bg-indigo-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-800 mb-2">✓ Secure Your Devices</h3>
                  <p className="text-sm text-gray-600">Use antivirus software and avoid public Wi-Fi for sensitive tasks</p>
                </div>
                <div className="bg-indigo-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-800 mb-2">✓ Log Out Properly</h3>
                  <p className="text-sm text-gray-600">Always log out when using shared or public computers</p>
                </div>
              </div>
            </div>
          </section>

          {/* Security Contact */}
          <section>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-4">Report a Security Issue</h2>
                <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
                  If you discover a security vulnerability or have security concerns, please report them 
                  immediately. We take all security reports seriously and will respond promptly.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <a
                  href="mailto:security@faceseek.com"
                  className="bg-white text-indigo-600 font-bold py-4 px-6 rounded-xl hover:bg-indigo-50 transition-colors text-center"
                >
                  🚨 security@faceseek.com
                </a>
                <a
                  href="https://faceseek.com/bug-bounty"
                  className="bg-white text-indigo-600 font-bold py-4 px-6 rounded-xl hover:bg-indigo-50 transition-colors text-center"
                >
                  🏆 Bug Bounty Program
                </a>
              </div>
              <p className="text-center text-indigo-200 text-sm mt-6">
                Expected response time: Within 24 hours for critical issues
              </p>
            </div>
          </section>
        </div>
      </div>
    </ClientOnly>
  );
}
