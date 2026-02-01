"use client";

import { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";

/**
 * About Page - Faceseek.com Hakkımızda
 * 
 * SEO: Professional About page with mission, vision, and team info
 */
export default function AboutPage() {
  const teamMembers = [
    {
      name: "Dr. Sarah Mitchell",
      role: "Chief Technology Officer",
      avatar: "👩‍💻",
      bio: "15+ years in AI and facial recognition technology"
    },
    {
      name: "Michael Chen",
      role: "Head of Security",
      avatar: "👨‍💼",
      bio: "Former cybersecurity expert with top tech companies"
    },
    {
      name: "Elena Rodriguez",
      role: "Lead Product Designer",
      avatar: "👩‍🎨",
      bio: "Award-winning UX/UI designer specializing in accessibility"
    },
    {
      name: "James Kumar",
      role: "Data Privacy Officer",
      avatar: "👨‍⚖️",
      bio: "Legal expert in GDPR and international data protection"
    }
  ];

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-black mb-6">About Faceseek.com</h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Empowering digital investigations with cutting-edge facial recognition and OSINT tools
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Mission Section */}
          <section className="mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🎯</span>
                <h2 className="text-3xl font-bold text-gray-800">Our Mission</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                At <span className="font-semibold text-indigo-600">Faceseek.com</span>, our mission is to provide professionals, 
                investigators, and security experts with powerful, ethical, and privacy-conscious tools for facial recognition 
                and open-source intelligence (OSINT) research.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                We believe in transparency, accountability, and responsible use of technology. Our platform is designed to 
                support legitimate investigations while respecting individual privacy rights and adhering to international 
                data protection regulations.
              </p>
            </div>
          </section>

          {/* Vision Section */}
          <section className="mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🔮</span>
                <h2 className="text-3xl font-bold text-gray-800">Our Vision</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                We envision a world where digital investigations are conducted ethically, efficiently, and with full 
                respect for human rights. By combining advanced AI technology with strict ethical guidelines, we aim 
                to become the most trusted platform for professional OSINT research.
              </p>
              <div className="bg-indigo-50 rounded-2xl p-6 mt-6">
                <h3 className="text-xl font-bold text-indigo-900 mb-3">Core Values</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">✓</span>
                    <span><strong>Privacy First:</strong> User data protection is our top priority</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">✓</span>
                    <span><strong>Ethical Use:</strong> Tools designed for legitimate purposes only</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">✓</span>
                    <span><strong>Transparency:</strong> Clear policies and open communication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">✓</span>
                    <span><strong>Innovation:</strong> Continuously improving our technology</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Services Section */}
          <section className="mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🛠️</span>
                <h2 className="text-3xl font-bold text-gray-800">Our Services</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-indigo-900 mb-3">👁️ Facial Recognition Search</h3>
                  <p className="text-gray-700">
                    Advanced AI-powered facial recognition technology to search across multiple databases and 
                    public sources for matching profiles and images.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-indigo-900 mb-3">🔍 OSINT Research Tools</h3>
                  <p className="text-gray-700">
                    Comprehensive open-source intelligence tools including Google Advanced Search integration 
                    for thorough digital investigations.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-indigo-900 mb-3">📊 Search History & Analytics</h3>
                  <p className="text-gray-700">
                    Track and analyze your investigation history with detailed reports and insights to 
                    improve your research efficiency.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-indigo-900 mb-3">🔐 Secure & Private Platform</h3>
                  <p className="text-gray-700">
                    Enterprise-grade security with end-to-end encryption, ensuring your investigations 
                    remain confidential and protected.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-4xl">👥</span>
                <h2 className="text-3xl font-bold text-gray-800">Meet Our Team</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {teamMembers.map((member, index) => (
                  <div 
                    key={index}
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 text-center hover:shadow-xl transition-shadow"
                  >
                    <div className="text-6xl mb-4">{member.avatar}</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{member.name}</h3>
                    <p className="text-sm text-indigo-600 font-medium mb-3">{member.role}</p>
                    <p className="text-xs text-gray-600">{member.bio}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-6 text-center">Why Choose Faceseek.com?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">⚡</div>
                  <h3 className="text-xl font-bold mb-2">Fast & Accurate</h3>
                  <p className="text-indigo-100">
                    Lightning-fast search results with industry-leading accuracy rates
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-3">🛡️</div>
                  <h3 className="text-xl font-bold mb-2">Secure & Compliant</h3>
                  <p className="text-indigo-100">
                    GDPR compliant with enterprise-grade security measures
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-3">💼</div>
                  <h3 className="text-xl font-bold mb-2">Professional Support</h3>
                  <p className="text-indigo-100">
                    24/7 expert support for all your investigation needs
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Get in Touch</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Have questions about our services or want to learn more about how Faceseek.com can help 
                your organization? We'd love to hear from you.
              </p>
              <a
                href="mailto:contact@faceseek.com"
                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg"
              >
                📧 Contact Us
              </a>
            </div>
          </section>
        </div>
      </div>
    </ClientOnly>
  );
}
