"use client";

import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Target,
  Globe,
  Lock,
  Cpu,
  Eye,
  Fingerprint,
  Search,
  Database,
  Zap,
  Award,
  Users,
  BarChart3,
  Layers,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isTR = locale === "tr";

  /* ---- Translations ---- */
  const t: Record<string, string> = isTR
    ? {
      heroTag: "Hakkımızda",
      heroTitle: "Etik Yüz İstihbaratı",
      heroSubtitle:
        "Gizlilik öncelikli, profesyonel yüz arama altyapısı. Sorumlu yapay zekâ ile desteklenen küresel güvenlik çözümleri.",
      missionTag: "Misyonumuz",
      missionTitle: "Sorumlu Yüz İstihbaratı",
      missionP1:
        "FaceSeek, yüz tanıma ve yüz arama teknolojisinde öncü bir SaaS platformudur. Etik görüntü istihbaratı ve gizlilik öncelikli yapay zekâ çözümleri sunarak güvenlik profesyonelleri, araştırmacı gazeteciler, OSINT uzmanları ve siber güvenlik ekipleri için güvenilir bir altyapı sağlıyoruz. Platformumuz, kamuya açık verilerdeki yüz görsellerini analiz ederek kimlik doğrulama, sahte hesap tespiti ve dijital iz takibi gibi kritik operasyonlarda yüksek doğruluklu sonuçlar sunar.",
      missionP2:
        "FaceSeek'in çekirdek felsefesi sorumlu yapay zekâ üzerine kuruludur. GDPR (Avrupa Genel Veri Koruma Yönetmeliği) ve KVKK (Kişisel Verilerin Korunması Kanunu) standartlarına tam uyum sağlayan platformumuz, biyometrik veri işleme süreçlerinde şeffaflık ve hukuki güvence sunar. Yüz arama motorumuz; derin öğrenme algoritmaları, FAISS vektör indeksleme ve çoklu OSINT kaynakları ile desteklenerek %98.7 doğruluk oranına ulaşır.",
      missionP3:
        "Bireylerden kurumsal kullanıcılara kadar herkese güvenli, doğrulanabilir ve etik kimlik tespiti araçları sunmak temel amacımızdır. FaceSeek ile yüz tanıma teknolojisi, kişisel gizlilikten ödün vermeden erişilebilir hâle gelir.",
      privacyTag: "Gizlilik Odaklı",
      privacyTitle: "Gizlilik Öncelikli Yüz Arama",
      privacyP1:
        "Geleneksel yüz tanıma veritabanlarının aksine, FaceSeek özel biyometrik arşivler oluşturmaz veya muhafaza etmez. Yüz arama motorumuz, kamusal olarak indekslenmiş internet üzerinde gelişmiş bir gerçek zamanlı lens görevi görür ve görüntü istihbarat sorgularını kalıcı veri depolaması olmadan işler.",
      privacyP2:
        "GDPR ve KVKK dahil uluslararası gizlilik standartlarına sıkı bir şekilde uyuyoruz. Platformumuz yalnızca meşru kimlik tespiti, tehdit önleme, araştırmacı gazetecilik ve profesyonel OSINT operasyonları için tasarlanmıştır — asla gözetim veya yasa dışı profilleme için değil.",
      privacyP3:
        "Kullanıcı yüklemeleri kalıcı olarak saklanmaz. Tüm veriler 256-bit AES şifreleme ile korunur ve işlem tamamlandıktan sonra geri dönüşümsüz olarak silinir.",
      visionTag: "Vizyonumuz",
      visionTitle: "Yapay Zekâ ile Sorumlu Aramanın Geleceği",
      visionP1:
        "FaceSeek olarak, yüz tanıma teknolojisinin insan haklarına ve bireysel gizliliğe tam saygı göstererek gelişebileceği bir gelecek hayal ediyoruz. Vizyonumuz, yapay zekâ destekli yüz aramanın yalnızca güçlü değil, aynı zamanda her adımda hesap verebilir olduğu bir dünya.",
      visionP2:
        "Amacımız, şeffaflık, etik uyumluluk ve teknolojik mükemmelliğin birleşimi ile sektörün referans noktası olmaktır. Gelecekte tüm arama işlemlerinin anonim, şifreli ve kullanıcı tarafından tam kontrol edilebilir olduğu bir platform altyapısı geliştiriyoruz.",
      visionP3:
        "Devletler, sivil toplum kuruluşları ve özel sektör ile iş birliğimiz, küresel olarak etik yüz arama standartlarının belirlenmesine öncülük etme taahhüdümüzün bir yansımasıdır.",
      techTag: "Teknoloji",
      techTitle: "İleri Teknoloji Altyapısı",
      techSubtitle:
        "FaceSeek, en son yapay zekâ ve makine öğrenimi teknolojilerini bir araya getirerek benzersiz bir yüz arama deneyimi sunar.",
      techAI: "Yapay Zekâ / Makine Öğrenimi",
      techAIDesc:
        "Derin öğrenme tabanlı yüz tanıma modelleri ile %98.7 doğruluk oranı. Sürekli öğrenme ve kendini iyileştirme yeteneği.",
      techFAISS: "FAISS Vektör Arama",
      techFAISSDesc:
        "Meta'nın FAISS vektör indeksleme teknolojisi ile milisaniye altında milyonlarca yüz vektörü arasında hassas eşleştirme.",
      techOSINT: "Çoklu Motor OSINT",
      techOSINTDesc:
        "Birden fazla arama motorunu ve açık kaynak istihbarat araçlarını birleştiren kapsamlı küresel arama altyapısı.",
      techEncrypt: "256-bit Şifreleme",
      techEncryptDesc:
        "Askerî düzeyde AES-256 şifreleme ile tüm veri iletimi ve geçici depolama uçtan uca korunur.",
      statsTag: "Rakamlarla FaceSeek",
      statsTitle: "Platform İstatistikleri",
      statsAccuracy: "Doğruluk Oranı",
      statsAccuracyVal: "%98.7",
      statsFaces: "İndekslenmiş Yüz",
      statsFacesVal: "10M+",
      statsCountries: "Ülke Kapsamı",
      statsCountriesVal: "50+",
      statsCompliance: "GDPR & KVKK",
      statsComplianceVal: "Tam Uyumlu",
      statsUptime: "Çalışma Süresi",
      statsUptimeVal: "%99.9",
      statsSearches: "Günlük Arama",
      statsSearchesVal: "100K+",
      brandTag: "Neden FaceSeek?",
      brandTitle: "Etik Yüz Aramanın Lideri",
      brandP1:
        "FaceSeek, gizlilik öncelikli mimari, yüksek doğruluklu yapay zekâ ve küresel kapsam ile diğer yüz arama platformlarından ayrışır. Teknolojimiz, güvenlik alanında çalışanların güvenerek kullanabileceği tek platform olmak için tasarlandı.",
      brandFeature1: "Sıfır Veri Saklama Politikası",
      brandFeature1Desc: "Aramalar tamamlandıktan sonra hiçbir biyometrik veri saklanmaz.",
      brandFeature2: "Küresel Kapsam & Yerel Uyumluluk",
      brandFeature2Desc: "50'den fazla ülkede arama yapabilme ve her bölgenin veri koruma yasalarına tam uyum.",
      brandFeature3: "Profesyonel OSINT Araçları",
      brandFeature3Desc: "Güvenlik ekipleri, gazeteciler ve araştırmacılar için özel olarak geliştirilmiş arama modülleri.",
      brandFeature4: "7/24 İzleme & Destek",
      brandFeature4Desc: "Platform sürekli izlenir ve öncelikli teknik destek her zaman hazırdır.",
      ctaTitle: "Etik Yüz Aramaya Başlayın",
      ctaSubtitle:
        "Hesabınızı oluşturun ve FaceSeek'in güçlü, gizlilik öncelikli yüz arama teknolojisini hemen deneyin.",
      ctaButton: "Ücretsiz Deneyin",
      ctaPricing: "Fiyatlandırma",
    }
    : {
      heroTag: "About Us",
      heroTitle: "Ethical Facial Intelligence",
      heroSubtitle:
        "Privacy-first, professional facial search infrastructure. Global security solutions powered by responsible AI.",
      missionTag: "Our Mission",
      missionTitle: "Responsible Facial Intelligence",
      missionP1:
        "FaceSeek is a global facial recognition SaaS platform specializing in ethical image intelligence and privacy-first facial search technology. We bridge the gap between vast public data and actionable insights for security professionals, investigative journalists, OSINT researchers, and cybersecurity teams worldwide.",
      missionP2:
        "Our core philosophy centers on responsible AI: we believe access to public information is a fundamental right when handled with absolute ethical integrity. Every facial search conducted through our platform adheres to strict GDPR and KVKK compliance standards, ensuring lawful and transparent facial recognition operations.",
      missionP3:
        "From individuals to enterprises, our goal is to empower every user with secure, verifiable, and ethical identification tools without ever compromising personal privacy.",
      privacyTag: "Privacy First",
      privacyTitle: "Privacy-First Facial Search",
      privacyP1:
        "Unlike traditional facial recognition databases, FaceSeek does not build or maintain proprietary biometric archives. Our facial search engine serves as a sophisticated real-time lens into the publicly indexed internet, processing image intelligence queries without permanent data storage.",
      privacyP2:
        "We strictly adhere to international privacy standards including GDPR (General Data Protection Regulation) and KVKK (Turkish Personal Data Protection Law). Our platform is designed for legitimate identification, threat prevention, investigative journalism, and professional OSINT operations only — never for surveillance or unlawful profiling.",
      privacyP3:
        "User uploads are never permanently stored. All data is protected with 256-bit encryption and irreversibly deleted upon processing completion.",
      visionTag: "Our Vision",
      visionTitle: "The Future of Responsible AI-Powered Search",
      visionP1:
        "At FaceSeek, we envision a future where facial recognition technology evolves with full respect for human rights and individual privacy. Our vision is a world where AI-powered search is not only powerful but accountable at every step.",
      visionP2:
        "Our aim is to become the industry benchmark through the convergence of transparency, ethical compliance, and technological excellence. We are building platform infrastructure where all search operations are anonymous, encrypted, and fully controllable by the user.",
      visionP3:
        "Our collaboration with governments, NGOs, and the private sector reflects our commitment to pioneering globally recognized ethical facial search standards.",
      techTag: "Technology",
      techTitle: "Advanced Technology Stack",
      techSubtitle:
        "FaceSeek combines cutting-edge AI and machine learning technologies to deliver an unparalleled facial search experience.",
      techAI: "AI / Machine Learning",
      techAIDesc:
        "Deep learning-based facial recognition models achieving 98.7% accuracy rate. Continuous learning and self-improvement capabilities.",
      techFAISS: "FAISS Vector Search",
      techFAISSDesc:
        "Meta's FAISS vector indexing technology enables precise matching across millions of face vectors in sub-millisecond time.",
      techOSINT: "Multi-Engine OSINT",
      techOSINTDesc:
        "Comprehensive global search infrastructure combining multiple search engines and open-source intelligence tools.",
      techEncrypt: "256-bit Encryption",
      techEncryptDesc:
        "Military-grade AES-256 encryption protects all data transmission and temporary storage end-to-end.",
      statsTag: "FaceSeek in Numbers",
      statsTitle: "Platform Statistics",
      statsAccuracy: "Accuracy Rate",
      statsAccuracyVal: "98.7%",
      statsFaces: "Indexed Faces",
      statsFacesVal: "10M+",
      statsCountries: "Country Coverage",
      statsCountriesVal: "50+",
      statsCompliance: "GDPR & KVKK",
      statsComplianceVal: "Fully Compliant",
      statsUptime: "Uptime",
      statsUptimeVal: "99.9%",
      statsSearches: "Daily Searches",
      statsSearchesVal: "100K+",
      brandTag: "Why FaceSeek?",
      brandTitle: "The Leader in Ethical Facial Search",
      brandP1:
        "FaceSeek sets itself apart from other facial search platforms with its privacy-first architecture, high-accuracy AI, and global coverage. Our technology is engineered to be the only platform security professionals can trust completely.",
      brandFeature1: "Zero Data Retention Policy",
      brandFeature1Desc: "No biometric data is stored after searches are completed.",
      brandFeature2: "Global Coverage & Local Compliance",
      brandFeature2Desc: "Search capabilities across 50+ countries with full compliance to each region's data protection laws.",
      brandFeature3: "Professional OSINT Tools",
      brandFeature3Desc: "Purpose-built search modules designed specifically for security teams, journalists, and researchers.",
      brandFeature4: "24/7 Monitoring & Support",
      brandFeature4Desc: "Platform is continuously monitored and priority technical support is always available.",
      ctaTitle: "Start Ethical Facial Search",
      ctaSubtitle:
        "Create your account and experience FaceSeek's powerful, privacy-first facial search technology today.",
      ctaButton: "Try for Free",
      ctaPricing: "Pricing",
    };

  /* ---- Stats data ---- */
  const stats = [
    {
      icon: <Target className="text-[#00d9ff]" size={28} />,
      value: t.statsAccuracyVal,
      label: t.statsAccuracy,
      color: "from-[#00d9ff]/20 to-[#00d9ff]/5",
      border: "border-[#00d9ff]/20",
    },
    {
      icon: <Database className="text-[#8b5cf6]" size={28} />,
      value: t.statsFacesVal,
      label: t.statsFaces,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      border: "border-[#8b5cf6]/20",
    },
    {
      icon: <Globe className="text-[#00d9ff]" size={28} />,
      value: t.statsCountriesVal,
      label: t.statsCountries,
      color: "from-[#00d9ff]/20 to-[#00d9ff]/5",
      border: "border-[#00d9ff]/20",
    },
    {
      icon: <ShieldCheck className="text-emerald-400" size={28} />,
      value: t.statsComplianceVal,
      label: t.statsCompliance,
      color: "from-emerald-400/20 to-emerald-400/5",
      border: "border-emerald-400/20",
    },
    {
      icon: <Zap className="text-amber-400" size={28} />,
      value: t.statsUptimeVal,
      label: t.statsUptime,
      color: "from-amber-400/20 to-amber-400/5",
      border: "border-amber-400/20",
    },
    {
      icon: <BarChart3 className="text-[#8b5cf6]" size={28} />,
      value: t.statsSearchesVal,
      label: t.statsSearches,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      border: "border-[#8b5cf6]/20",
    },
  ];

  /* ---- Tech stack data ---- */
  const techStack = [
    {
      icon: <Cpu size={32} />,
      title: t.techAI,
      desc: t.techAIDesc,
      gradient: "from-[#00d9ff] to-[#8b5cf6]",
    },
    {
      icon: <Search size={32} />,
      title: t.techFAISS,
      desc: t.techFAISSDesc,
      gradient: "from-[#8b5cf6] to-pink-500",
    },
    {
      icon: <Layers size={32} />,
      title: t.techOSINT,
      desc: t.techOSINTDesc,
      gradient: "from-[#00d9ff] to-emerald-400",
    },
    {
      icon: <Lock size={32} />,
      title: t.techEncrypt,
      desc: t.techEncryptDesc,
      gradient: "from-emerald-400 to-[#00d9ff]",
    },
  ];

  /* ---- Brand features ---- */
  const brandFeatures = [
    { icon: <Fingerprint size={20} />, title: t.brandFeature1, desc: t.brandFeature1Desc },
    { icon: <Globe size={20} />, title: t.brandFeature2, desc: t.brandFeature2Desc },
    { icon: <Search size={20} />, title: t.brandFeature3, desc: t.brandFeature3Desc },
    { icon: <Users size={20} />, title: t.brandFeature4, desc: t.brandFeature4Desc },
  ];

  return (
    <ClientOnly>
      <div className="min-h-screen bg-[#0a0e27] text-slate-200">
        <Navbar />

        {/* ============================================================ */}
        {/*  HERO                                                        */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden">
          {/* Background gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00d9ff]/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#8b5cf6]/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-6 pt-32 pb-20 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center"
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff]/20 text-[10px] font-black uppercase tracking-[0.3em] text-[#00d9ff] mb-6">
                  <Eye size={14} />
                  {t.heroTag}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-tight mb-6"
              >
                {t.heroTitle.split(" ").map((word, i) => (
                  <span key={i}>
                    {i === t.heroTitle.split(" ").length - 1 ? (
                      <span className="bg-gradient-to-r from-[#00d9ff] to-[#8b5cf6] bg-clip-text text-transparent">
                        {word}
                      </span>
                    ) : (
                      word
                    )}{" "}
                  </span>
                ))}
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
              >
                {t.heroSubtitle}
              </motion.p>
            </motion.div>
          </div>

          {/* Decorative line */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent" />
        </section>

        {/* ============================================================ */}
        {/*  MISSION                                                      */}
        {/* ============================================================ */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
          >
            {/* Mission */}
            <motion.div variants={fadeUp} custom={0}>
              <GlassCard className="p-10 h-full" hasScanline>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff]/20 text-[10px] font-black uppercase tracking-[0.3em] text-[#00d9ff] mb-6">
                  <Eye size={12} />
                  {t.missionTag}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-6 uppercase tracking-tight">
                  {t.missionTitle}
                </h2>
                <div className="space-y-4">
                  <p className="text-zinc-400 leading-relaxed">{t.missionP1}</p>
                  <p className="text-zinc-400 leading-relaxed">{t.missionP2}</p>
                  <p className="text-zinc-500 leading-relaxed text-sm">{t.missionP3}</p>
                </div>
                {/* Accent bar */}
                <div className="mt-8 h-1 w-20 bg-gradient-to-r from-[#00d9ff] to-[#8b5cf6] rounded-full" />
              </GlassCard>
            </motion.div>

            {/* Privacy */}
            <motion.div variants={fadeUp} custom={1}>
              <GlassCard className="p-10 h-full" hasScanline>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[10px] font-black uppercase tracking-[0.3em] text-[#8b5cf6] mb-6">
                  <ShieldCheck size={12} />
                  {t.privacyTag}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-6 uppercase tracking-tight">
                  {t.privacyTitle}
                </h2>
                <div className="space-y-4">
                  <p className="text-zinc-400 leading-relaxed">{t.privacyP1}</p>
                  <p className="text-zinc-400 leading-relaxed">{t.privacyP2}</p>
                  <p className="text-zinc-500 leading-relaxed text-sm">{t.privacyP3}</p>
                </div>
                <div className="mt-8 h-1 w-20 bg-gradient-to-r from-[#8b5cf6] to-pink-500 rounded-full" />
              </GlassCard>
            </motion.div>
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/*  VISION                                                       */}
        {/* ============================================================ */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#8b5cf6]/[0.03] to-transparent pointer-events-none" />
          <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[10px] font-black uppercase tracking-[0.3em] text-[#8b5cf6] mb-4">
                  <Fingerprint size={12} />
                  {t.visionTag}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                  {t.visionTitle}
                </h2>
              </motion.div>

              <motion.div variants={fadeUp} custom={1}>
                <GlassCard className="p-10 md:p-14" hasScanline>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[t.visionP1, t.visionP2, t.visionP3].map((text, i) => (
                      <div key={i} className="relative">
                        <div className="text-5xl font-black text-[#8b5cf6]/10 mb-4">
                          0{i + 1}
                        </div>
                        <p className="text-zinc-400 leading-relaxed">{text}</p>
                        {i < 2 && (
                          <div className="hidden md:block absolute top-1/2 -right-4 w-px h-16 bg-gradient-to-b from-transparent via-[#8b5cf6]/30 to-transparent" />
                        )}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  KEY STATS GRID                                               */}
        {/* ============================================================ */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff]/20 text-[10px] font-black uppercase tracking-[0.3em] text-[#00d9ff] mb-4">
                <BarChart3 size={12} />
                {t.statsTag}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                {t.statsTitle}
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {stats.map((stat, i) => (
                <motion.div key={i} variants={scaleIn} custom={i}>
                  <div
                    className={`relative bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-6 md:p-8 text-center group hover:scale-[1.03] transition-transform duration-300`}
                  >
                    <div className="flex justify-center mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
                      {stat.icon}
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-[#00d9ff]/20 to-transparent" />
        </div>

        {/* ============================================================ */}
        {/*  TECHNOLOGY STACK                                             */}
        {/* ============================================================ */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff]/20 text-[10px] font-black uppercase tracking-[0.3em] text-[#00d9ff] mb-4">
                <Cpu size={12} />
                {t.techTag}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                {t.techTitle}
              </h2>
            </motion.div>

            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-center text-zinc-400 max-w-2xl mx-auto mb-12"
            >
              {t.techSubtitle}
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {techStack.map((tech, i) => (
                <motion.div key={i} variants={fadeUp} custom={i + 2}>
                  <GlassCard className="p-8 h-full group" hasScanline>
                    <div className="flex items-start gap-5">
                      <div
                        className={`w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br ${tech.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        {tech.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                          {tech.title}
                        </h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          {tech.desc}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/*  BRAND POSITIONING                                            */}
        {/* ============================================================ */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00d9ff]/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff]/20 text-[10px] font-black uppercase tracking-[0.3em] text-[#00d9ff] mb-4">
                  <Award size={12} />
                  {t.brandTag}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
                  {t.brandTitle}
                </h2>
                <p className="text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                  {t.brandP1}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {brandFeatures.map((feat, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i + 1}>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:border-[#00d9ff]/30 transition-all duration-300 group h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d9ff]/20 to-[#8b5cf6]/20 border border-[#00d9ff]/10 flex items-center justify-center text-[#00d9ff] group-hover:scale-110 transition-transform">
                          {feat.icon}
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide">
                          {feat.title}
                        </h4>
                      </div>
                      <p className="text-zinc-500 text-sm leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  ORIGINAL QUICK-GLANCE GRID (enhanced)                       */}
        {/* ============================================================ */}
        <section className="max-w-6xl mx-auto px-6 pb-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="grid grid-cols-2 sm:grid-cols-4 gap-5"
          >
            {[
              {
                icon: <Target className="text-[#00d9ff]" size={22} />,
                title: isTR ? "Hassasiyet" : "Precision",
                desc: isTR
                  ? "%98.7 biyometrik eslestirme dogrulugu."
                  : "98.7% biometric matching accuracy.",
              },
              {
                icon: <Globe className="text-[#00d9ff]" size={22} />,
                title: isTR ? "Kuresel Erisim" : "Global Reach",
                desc: isTR
                  ? "Tum buyuk veri kumelerinde indekslenmis."
                  : "Indexed across all major data clusters.",
              },
              {
                icon: <Lock className="text-[#8b5cf6]" size={22} />,
                title: isTR ? "E2E Gizlilik" : "E2E Privacy",
                desc: isTR
                  ? "Kullanici yuklemelerinin kalici depolanmasi yok."
                  : "No permanent storage of user uploads.",
              },
              {
                icon: <Cpu className="text-[#8b5cf6]" size={22} />,
                title: isTR ? "Yeni Nesil AI" : "Next-Gen AI",
                desc: isTR
                  ? "Ozel tanimlama algoritmalari."
                  : "Proprietary recognition algorithms.",
              },
            ].map((item, idx) => (
              <motion.div key={idx} variants={scaleIn} custom={idx}>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center text-center hover:border-[#00d9ff]/30 transition-all group h-full">
                  <div className="mb-3 transform group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-2">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/*  CTA                                                          */}
        {/* ============================================================ */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            custom={0}
          >
            <GlassCard className="p-10 md:p-16 text-center" hasScanline>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
                  {t.ctaTitle}
                </h2>
                <p className="text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
                  {t.ctaSubtitle}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={`/${locale}/register`}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00d9ff] to-[#8b5cf6] text-white font-black uppercase tracking-wider text-sm rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#00d9ff]/20"
                  >
                    {t.ctaButton}
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href={`/${locale}/pricing`}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/[0.05] border border-white/[0.1] text-white font-black uppercase tracking-wider text-sm rounded-xl hover:bg-white/[0.1] transition-colors"
                  >
                    {t.ctaPricing}
                  </Link>
                </div>
              </div>
              {/* CTA background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#00d9ff]/[0.05] via-transparent to-[#8b5cf6]/[0.05] pointer-events-none rounded-2xl" />
            </GlassCard>
          </motion.div>
        </section>

        {/* Bottom spacer */}
        <div className="h-12" />
      </div>
    </ClientOnly>
  );
}
