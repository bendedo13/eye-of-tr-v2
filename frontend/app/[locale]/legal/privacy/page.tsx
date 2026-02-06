import LegalLayout from "../../../legal_layout_provider";
import LegalContent from "@/components/legal/LegalContent";
import { use } from "react";

export default function PrivacyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  
  const fallback = (
    <div className="space-y-10 font-sans">
      <section>
        <h2 className="text-xl font-bold text-white border-l-4 border-face-seek-cyan pl-4">1. Topladığımız Bilgiler</h2>
        <ul className="list-disc pl-6 space-y-2 text-zinc-400">
          <li><strong>Hesap Bilgileri:</strong> Kayıt olurken sağladığınız e-posta adresi ve kullanıcı adı.</li>
          <li><strong>İşlem Verileri:</strong> Arama geçmişi meta verileri (aranan tarih, sonuç sayısı). <em>Kimin arandığına dair görsel veri saklanmaz.</em></li>
          <li><strong>Teknik Veriler:</strong> IP adresi, tarayıcı türü ve cihaz bilgileri.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white border-l-4 border-face-seek-cyan pl-4">2. Biyometrik Veri ve Yüz Tanıma İşlemleri</h2>
        <p className="text-zinc-400">
          FaceSeek, "Zero-Knowledge" (Sıfır Bilgi) mimarisi ile çalışır:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-zinc-400">
          <li><strong>Geçici İşleme:</strong> Yüklediğiniz fotoğraf, yalnızca yüz vektörünü (matematiksel imza) çıkarmak için sunucularımızda anlık olarak işlenir.</li>
          <li><strong>Saklama Yok:</strong> İşlem tamamlandıktan sonra orijinal fotoğraf sunucularımızdan otomatik olarak silinir.</li>
          <li><strong>Veri Paylaşımı Yok:</strong> Biyometrik verileriniz üçüncü taraflara satılmaz veya pazarlama amacıyla paylaşılmaz.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white border-l-4 border-face-seek-cyan pl-4">3. Çerezler (Cookies)</h2>
        <p className="text-zinc-400">
          Hizmetlerimizi sunmak, güvenliği sağlamak ve kullanıcı deneyimini geliştirmek (oturumun açık kalması vb.) amacıyla çerezler kullanmaktayız. Tarayıcı ayarlarınızdan çerezleri dilediğiniz zaman engelleyebilirsiniz.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white border-l-4 border-face-seek-cyan pl-4">4. Veri Güvenliği</h2>
        <p className="text-zinc-400">
          Verileriniz, endüstri standardı <strong>AES-256 şifreleme</strong> ile korunmaktadır. Veri aktarımı sırasında <strong>TLS 1.3</strong> protokolü kullanılır. Altyapımız, düzenli güvenlik testlerinden geçirilmektedir.
        </p>
      </section>

      <section className="bg-primary/5 p-6 rounded-2xl border border-primary/10 mt-8">
        <h2 className="text-face-seek-cyan font-black uppercase tracking-widest text-sm mb-2">İLETİŞİM</h2>
        <p className="text-zinc-400 text-sm">
          Gizlilik politikamızla ilgili sorularınız için bizimle iletişime geçebilirsiniz:<br/>
          <strong>E-posta:</strong> <a href="mailto:privacy@face-seek.com" className="text-face-seek-cyan hover:underline">privacy@face-seek.com</a>
        </p>
      </section>
    </div>
  );

  return (
    <LegalLayout>
      <LegalContent
        locale={locale}
        slug="privacy"
        fallbackTitle="GİZLİLİK POLİTİKASI"
        fallbackSubtitle="Son Güncelleme: 5 Şubat 2026"
        fallbackContent={fallback}
      />
    </LegalLayout>
  );
}
