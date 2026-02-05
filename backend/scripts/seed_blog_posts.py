import sys
from pathlib import Path
from datetime import datetime
import logging

# Add parent directory to path to allow importing app
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.database import SessionLocal
from app.models.cms import BlogPost

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_blog_posts():
    db = SessionLocal()
    
    try:
        # Check if posts already exist
        count = db.query(BlogPost).count()
        if count > 0:
            logger.info(f"Database already contains {count} blog posts. Skipping seed.")
            return

        posts = [
            {
                "locale": "tr",
                "slug": "veri-guvenligi-cozumleri-ve-yuz-tanima",
                "title": "Veri Güvenliği Çözümleri ve Yüz Tanıma Teknolojisinin Geleceği",
                "excerpt": "Modern veri güvenliği çözümleri arasında yüz tanıma teknolojisinin yeri ve biyometrik verilerin korunmasındaki önemi hakkında kapsamlı bir rehber.",
                "content_html": """
                <h2>Veri Güvenliği Çözümleri Neden Önemli?</h2>
                <p>Dijital dünyada her geçen gün artan siber tehditler, kurumları ve bireyleri daha gelişmiş <strong>veri güvenliği çözümleri</strong> aramaya itmektedir. Geleneksel şifreleme yöntemleri artık tek başına yeterli olmamakta, çok faktörlü kimlik doğrulama sistemleri standart hale gelmektedir.</p>
                
                <h3>Biyometrik Verilerin Korunması</h3>
                <p>Yüz tanıma teknolojisi, güvenlik süreçlerini hızlandırırken, biyometrik verilerin nasıl saklandığı sorusunu da beraberinde getirmektedir. FaceSeek olarak biz, "Zero-Knowledge" prensibiyle çalışarak kullanıcılarımızın veri güvenliğini en üst düzeyde tutuyoruz.</p>
                
                <h3>Geleceğin Güvenlik Trendleri</h3>
                <p>Yapay zeka destekli güvenlik duvarları ve davranışsal analiz sistemleri, veri ihlallerini önceden tespit etmede kritik rol oynamaktadır. Özellikle finans ve sağlık sektörlerinde, <strong>veri güvenliği çözümleri</strong> artık bir tercih değil, yasal bir zorunluluktur.</p>
                """,
                "cover_image_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
                "author_name": "FaceSeek Editör Ekibi",
                "is_published": True,
                "published_at": datetime.now()
            },
            {
                "locale": "tr",
                "slug": "yasal-uyum-danismanligi-neden-gerekli",
                "title": "Dijital İşletmeler İçin Yasal Uyum Danışmanlığı Neden Gerekli?",
                "excerpt": "KVKK ve GDPR süreçlerinde işletmelerin dikkat etmesi gereken noktalar ve yasal uyum danışmanlığının önemi.",
                "content_html": """
                <h2>Yasal Uyum ve Dijitalleşme</h2>
                <p>Teknolojinin hızla gelişmesiyle birlikte, kişisel verilerin işlenmesi konusundaki regülasyonlar da sıkılaşmaktadır. Özellikle Avrupa'da GDPR ve Türkiye'de KVKK, işletmelerin veri politikalarını yeniden şekillendirmelerine neden olmuştur. Bu noktada <strong>yasal uyum danışmanlığı</strong> hizmetleri hayati önem taşır.</p>
                
                <h3>KVKK Süreçlerinde Dikkat Edilmesi Gerekenler</h3>
                <ul>
                    <li>Aydınlatma metinlerinin güncelliği</li>
                    <li>Açık rıza alma süreçlerinin şeffaflığı</li>
                    <li>Veri envanterinin doğru tutulması</li>
                </ul>
                
                <p>Profesyonel bir <strong>yasal uyum danışmanlığı</strong>, işletmenizi sadece cezalardan korumakla kalmaz, aynı zamanda müşterileriniz nezdinde güvenilirliğinizi de artırır.</p>
                """,
                "cover_image_url": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80",
                "author_name": "Av. Mehmet Yılmaz",
                "is_published": True,
                "published_at": datetime.now()
            },
            {
                "locale": "tr",
                "slug": "yuz-tanima-teknolojisi-nasil-calisir",
                "title": "Yüz Tanıma Teknolojisi: Bilim Kurgudan Gerçeğe",
                "excerpt": "Yüz tanıma teknolojisinin arkasındaki algoritmalar ve günlük hayatımızdaki kullanım alanları.",
                "content_html": """
                <h2>Yüz Tanıma Teknolojisi Nedir?</h2>
                <p>Bir zamanlar sadece bilim kurgu filmlerinde gördüğümüz <strong>yüz tanıma teknolojisi</strong>, bugün akıllı telefonlarımızdan havalimanı güvenlik kontrollerine kadar her yerde karşımıza çıkıyor. Peki bu sistemler nasıl çalışıyor?</p>
                
                <h3>Algoritmaların Gücü</h3>
                <p>Yüz tanıma sistemleri, bir yüzün geometrisini analiz ederek çalışır. Gözler arasındaki mesafe, burun genişliği, çene yapısı gibi 80'den fazla düğüm noktası ölçülerek benzersiz bir "yüz izi" oluşturulur.</p>
                
                <p>FaceSeek olarak kullandığımız gelişmiş <strong>yüz tanıma teknolojisi</strong>, yüksek doğruluk oranıyla saniyeler içinde sonuç verirken, gizlilik prensiplerinden ödün vermemektedir.</p>
                """,
                "cover_image_url": "https://images.unsplash.com/photo-1561587931-1e967a57a840?auto=format&fit=crop&w=800&q=80",
                "author_name": "Teknoloji Ekibi",
                "is_published": True,
                "published_at": datetime.now()
            },
            {
                "locale": "tr",
                "slug": "osint-araclari-ile-dijital-arastirma",
                "title": "OSINT Araçları ile Dijital Araştırma Teknikleri",
                "excerpt": "Açık kaynak istihbaratı (OSINT) nedir ve dijital araştırmalarda OSINT araçları nasıl etkin kullanılır?",
                "content_html": """
                <h2>Açık Kaynak İstihbaratı (OSINT) Nedir?</h2>
                <p>OSINT (Open Source Intelligence), kamuya açık kaynaklardan elde edilen verilerin toplanması ve analiz edilmesi sürecidir. Gazeteciler, araştırmacılar ve siber güvenlik uzmanları, <strong>OSINT araçları</strong> kullanarak derinlemesine analizler yapabilirler.</p>
                
                <h3>Etkin OSINT Kullanımı</h3>
                <p>Doğru bilgiye ulaşmak için doğru araçları kullanmak şarttır. Tersine görsel arama (reverse image search), sosyal medya analizi ve domain sorgulama servisleri, en sık kullanılan <strong>OSINT araçları</strong> arasındadır.</p>
                
                <p>Bu araçları kullanırken etik kurallara ve yasal sınırlara dikkat etmek, araştırmanın meşruiyeti açısından kritiktir.</p>
                """,
                "cover_image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
                "author_name": "Siber Güvenlik Uzmanı",
                "is_published": True,
                "published_at": datetime.now()
            },
            {
                "locale": "tr",
                "slug": "biyometrik-veri-guvenligi-ipuclari",
                "title": "Biyometrik Veri Güvenliği İçin 5 Kritik İpucu",
                "excerpt": "Parmak izi ve yüz verilerinizi korumak için almanız gereken önlemler ve biyometrik veri güvenliği standartları.",
                "content_html": """
                <h2>Biyometrik Verileriniz Güvende mi?</h2>
                <p>Şifrenizi değiştirebilirsiniz, ancak parmak izinizi veya yüzünüzü değiştiremezsiniz. Bu nedenle <strong>biyometrik veri güvenliği</strong>, geleneksel şifre güvenliğinden çok daha kritiktir.</p>
                
                <h3>Alınması Gereken Önlemler</h3>
                <ol>
                    <li>Biyometrik verilerinizi sadece güvenilir cihazlarda kullanın.</li>
                    <li>İki faktörlü kimlik doğrulamayı (2FA) mutlaka etkinleştirin.</li>
                    <li>Verilerinizin yerel cihazda mı yoksa bulutta mı saklandığını sorgulayın.</li>
                </ol>
                
                <p>FaceSeek olarak, <strong>biyometrik veri güvenliği</strong> konusunda en yüksek standartları (ISO 27001) benimsiyor ve verilerinizi asla kalıcı olarak saklamıyoruz.</p>
                """,
                "cover_image_url": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
                "author_name": "Güvenlik Ekibi",
                "is_published": True,
                "published_at": datetime.now()
            },
            {
                "locale": "tr",
                "slug": "kisisel-verilerin-korunmasi-rehberi",
                "title": "Bireyler İçin Kişisel Verilerin Korunması Rehberi",
                "excerpt": "Dijital dünyada kişisel verilerinizi nasıl korursunuz? KVKK haklarınız ve pratik koruma yöntemleri.",
                "content_html": """
                <h2>Dijital Ayak İzinizi Kontrol Edin</h2>
                <p>İnternet üzerinde yaptığımız her işlem bir iz bırakır. <strong>Kişisel verilerin korunması</strong>, sadece kurumların değil, bireylerin de sorumluluğundadır. Sosyal medya paylaşımlarınızdan online alışverişlerinize kadar her alanda bilinçli olmalısınız.</p>
                
                <h3>KVKK Kapsamındaki Haklarınız</h3>
                <p>Türkiye'de yaşayan her birey, KVKK kapsamında verilerinin silinmesini isteme ("unutulma hakkı") ve verilerinin kimlerle paylaşıldığını öğrenme hakkına sahiptir. <strong>Kişisel verilerin korunması</strong> kanunu, size verileriniz üzerinde tam kontrol yetkisi verir.</p>
                """,
                "cover_image_url": "https://images.unsplash.com/photo-1510915361405-ef2dbf44d7f6?auto=format&fit=crop&w=800&q=80",
                "author_name": "Hukuk Departmanı",
                "is_published": True,
                "published_at": datetime.now()
            },
            {
                "locale": "tr",
                "slug": "dijital-ayak-izi-silme-yontemleri",
                "title": "Dijital Ayak İzi Silme: İnternetten Nasıl Yok Olunur?",
                "excerpt": "Eski hesapları kapatmak, arama sonuçlarından adınızı kaldırmak ve dijital ayak izi silme yöntemleri.",
                "content_html": """
                <h2>İnternet Her Şeyi Hatırlar mı?</h2>
                <p>Çoğu zaman evet, ancak bu izleri temizlemenin yolları vardır. <strong>Dijital ayak izi silme</strong>, sabır ve titizlik gerektiren bir süreçtir. Eski forum üyelikleri, kullanılmayan sosyal medya hesapları ve e-bülten abonelikleri, dijital kirliliğin ana kaynaklarıdır.</p>
                
                <h3>Adım Adım Temizlik</h3>
                <p>İlk adım, adınızı arama motorlarında aratmaktır. Çıkan sonuçlara göre ilgili sitelerle iletişime geçerek içerik kaldırma talebinde bulunabilirsiniz. Profesyonel <strong>dijital ayak izi silme</strong> hizmetleri de bu süreçte size destek olabilir.</p>
                """,
                "cover_image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
                "author_name": "Gizlilik Uzmanı",
                "is_published": True,
                "published_at": datetime.now()
            },
            {
                "locale": "tr",
                "slug": "siber-guvenlik-onlemleri-2026",
                "title": "2026 Yılı İçin Temel Siber Güvenlik Önlemleri",
                "excerpt": "Yeni nesil tehditlere karşı almanız gereken siber güvenlik önlemleri ve fidye yazılımlarından korunma yolları.",
                "content_html": """
                <h2>Tehditler Evriliyor, Peki Ya Savunmanız?</h2>
                <p>Siber saldırganlar artık yapay zeka destekli araçlar kullanıyor. Bu nedenle, alacağınız <strong>siber güvenlik önlemleri</strong> de çağa ayak uydurmalıdır. Basit bir antivirüs yazılımı artık yeterli değildir.</p>
                
                <h3>Fidye Yazılımlarından Korunma</h3>
                <p>Düzenli yedekleme yapmak, fidye yazılımlarına (ransomware) karşı en etkili <strong>siber güvenlik önlemleri</strong> arasındadır. Ayrıca, kaynağını bilmediğiniz e-postalardaki linklere tıklamamak ve yazılımlarınızı güncel tutmak hayati önem taşır.</p>
                """,
                "cover_image_url": "https://images.unsplash.com/photo-1496096265110-f83ad7f96608?auto=format&fit=crop&w=800&q=80",
                "author_name": "Teknoloji Ekibi",
                "is_published": True,
                "published_at": datetime.now()
            },
            {
                "locale": "tr",
                "slug": "yapay-zeka-etik-kurallari",
                "title": "Yapay Zeka Etik Kuralları ve Toplumsal Etkileri",
                "excerpt": "Yapay zekanın geliştirilmesinde uyulması gereken etik kurallar ve önyargısız algoritmaların önemi.",
                "content_html": """
                <h2>Teknoloji ve Vicdan</h2>
                <p>Yapay zeka hayatımızın her alanına girerken, <strong>yapay zeka etik kuralları</strong> tartışmaları da alevlenmektedir. Algoritmaların tarafsızlığı, şeffaflık ve hesap verebilirlik, bu alanın temel taşlarıdır.</p>
                
                <h3>Önyargısız Algoritmalar</h3>
                <p>FaceSeek olarak geliştirdiğimiz sistemlerde, ırk, cinsiyet veya yaş ayrımı yapmayan, evrensel <strong>yapay zeka etik kuralları</strong> çerçevesinde çalışan modeller kullanıyoruz. Teknolojinin insanlığın faydasına olması gerektiğine inanıyoruz.</p>
                """,
                "cover_image_url": "https://images.unsplash.com/photo-1535378437323-95558417873e?auto=format&fit=crop&w=800&q=80",
                "author_name": "Etik Kurulu",
                "is_published": True,
                "published_at": datetime.now()
            },
            {
                "locale": "tr",
                "slug": "kimlik-dogrulama-sistemleri-karsilastirmasi",
                "title": "Biyometrik ve Dijital Kimlik Doğrulama Sistemleri Karşılaştırması",
                "excerpt": "Hangi kimlik doğrulama yöntemi daha güvenli? SMS, Authenticator ve Biyometrik sistemlerin analizi.",
                "content_html": """
                <h2>Şifrelerin Sonu mu Geliyor?</h2>
                <p>Geleneksel şifreler unutulabilir veya çalınabilir. Bu nedenle <strong>kimlik doğrulama sistemleri</strong> giderek biyometrik çözümlere kaymaktadır. Yüz tanıma, parmak izi ve iris tarama, en güvenilir yöntemler olarak öne çıkmaktadır.</p>
                
                <h3>SMS Doğrulama Güvenli mi?</h3>
                <p>SIM swapping saldırıları nedeniyle SMS ile doğrulama artık en güvenli yöntem kabul edilmemektedir. Bunun yerine Authenticator uygulamaları veya biyometrik <strong>kimlik doğrulama sistemleri</strong> tercih edilmelidir.</p>
                """,
                "cover_image_url": "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=800&q=80",
                "author_name": "Güvenlik Analisti",
                "is_published": True,
                "published_at": datetime.now()
            }
        ]

        for post_data in posts:
            post = BlogPost(**post_data)
            db.add(post)
        
        db.commit()
        logger.info(f"Successfully seeded {len(posts)} blog posts.")

    except Exception as e:
        logger.error(f"Error seeding blog posts: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_blog_posts()
