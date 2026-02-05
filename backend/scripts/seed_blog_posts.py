from app.db.database import SessionLocal
from app.models.cms import BlogPost
from datetime import datetime, timezone

def seed_blog_posts():
    db = SessionLocal()
    
    # Check if posts already exist to avoid duplicates
    # count = db.query(BlogPost).count()
    # if count >= 20:
    #    print("Blog posts already seeded.")
    #    return

    posts_tr = [
        {
            "title": "Veri Güvenliği Çözümleri: Yüz Tanıma Teknolojisinde Yeni Dönem",
            "slug": "veri-guvenligi-cozumleri-yuz-tanima",
            "excerpt": "Kişisel verilerin korunması ve biyometrik güvenlik sistemlerinde FaceSeek'in sunduğu yenilikçi veri güvenliği çözümlerini keşfedin.",
            "content_html": """
                <p>Dijital dünyada kimlik doğrulama ve güvenlik ihtiyacı her geçen gün artıyor. <strong>Veri güvenliği çözümleri</strong>, özellikle biyometrik verilerin işlendiği sistemlerde hayati önem taşıyor. FaceSeek olarak, kullanıcılarımızın güvenliğini en üst düzeyde tutmak için "Zero-Knowledge" (Sıfır Bilgi) prensibini benimsiyoruz.</p>
                <h2>Biyometrik Verilerde Güvenlik Standartları</h2>
                <p>Yüz tanıma teknolojileri, geleneksel şifreleme yöntemlerine göre çok daha güvenli olsa da, bu verilerin saklanması büyük riskler barındırır. İşte bu noktada FaceSeek, görsel verilerinizi asla kalıcı olarak saklamayarak sektörde fark yaratıyor.</p>
                <h3>Neden FaceSeek?</h3>
                <ul>
                    <li><strong>Anlık İşleme:</strong> Görüntüler sadece analiz anında işlenir.</li>
                    <li><strong>KVKK Uyumu:</strong> Türkiye Cumhuriyeti yasalarına tam uyumlu altyapı.</li>
                    <li><strong>Yüksek Şifreleme:</strong> Tüm veriler AES-256 ile korunur.</li>
                </ul>
                <p>Geleceğin güvenlik teknolojileri hakkında daha fazla bilgi almak için <a href="/tr/legal/about">Hakkımızda</a> sayfamızı ziyaret edebilirsiniz.</p>
            """
        },
        {
            "title": "Yasal Uyum Danışmanlığı ve OSINT Araçları",
            "slug": "yasal-uyum-danismanligi-osint",
            "excerpt": "Açık kaynak istihbarat (OSINT) araçlarını kullanırken yasal uyum danışmanlığı almanın önemi ve dikkat edilmesi gerekenler.",
            "content_html": """
                <p>İnternet üzerindeki açık kaynaklardan bilgi toplamak (OSINT), araştırmacılar ve güvenlik uzmanları için vazgeçilmez bir yöntemdir. Ancak bu süreçte <strong>yasal uyum danışmanlığı</strong> prensiplerine dikkat etmek gerekir.</p>
                <h2>Hukuki Sınırlar ve Etik Kullanım</h2>
                <p>Bir kişinin fotoğrafını aratmak, KVKK kapsamında "kişisel veri işleme" faaliyeti sayılabilir. FaceSeek, bu süreçleri tamamen yasal sınırlar içinde tutmanıza yardımcı olan araçlar sunar.</p>
                <p>Etik kullanım ve yasal sorumluluklar hakkında detaylı bilgi için <a href="/tr/legal/terms">Kullanım Şartları</a> sayfamızı incelemenizi öneririz.</p>
            """
        },
        {
            "title": "Dijital Kimlik Doğrulama: Dolandırıcılıkla Mücadele",
            "slug": "dijital-kimlik-dogrulama-fraud",
            "excerpt": "Online platformlarda güvenliği artırmak için dijital kimlik doğrulama yöntemleri ve dolandırıcılıkla mücadele stratejileri.",
            "content_html": """
                <p>İnternet dolandırıcılığı (fraud), günümüzün en büyük siber tehditlerinden biridir. <strong>Dijital kimlik doğrulama</strong> sistemleri, bu tehditlere karşı en etkili savunma mekanizmasıdır.</p>
                <h2>Sahte Profilleri Tespit Etme</h2>
                <p>Catfishing ve sahte profil oluşturma, sosyal medya kullanıcılarının sıkça karşılaştığı sorunlardır. FaceSeek'in gelişmiş algoritmaları, bir fotoğrafın internetin başka köşelerinde kullanılıp kullanılmadığını saniyeler içinde tespit eder.</p>
            """
        },
        {
            "title": "Kişisel Verilerin Korunması Kanunu (KVKK) Nedir?",
            "slug": "kvkk-nedir-veri-koruma",
            "excerpt": "Türkiye'de kişisel verilerin korunması kanunu hakkında bilmeniz gereken her şey. Haklarınız ve veri sorumlularının yükümlülükleri.",
            "content_html": """
                <p>6698 sayılı <strong>Kişisel Verilerin Korunması Kanunu (KVKK)</strong>, bireylerin temel hak ve özgürlüklerini korumak amacıyla düzenlenmiştir. FaceSeek olarak tüm süreçlerimizi bu kanuna tam uyumlu hale getirdik.</p>
                <h2>Veri Sorumlusu Kimdir?</h2>
                <p>Veri sorumlusu, kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen kişidir. Bizimle paylaştığınız veriler, sadece belirtilen amaçlarla ve şeffaflık ilkesiyle işlenir.</p>
                <p>Detaylı aydınlatma metnimize <a href="/tr/legal/kvkk">buradan</a> ulaşabilirsiniz.</p>
            """
        },
        {
            "title": "Yüz Tanıma Teknolojisi Nasıl Çalışır?",
            "slug": "yuz-tanima-teknolojisi-nasil-calisir",
            "excerpt": "Biyometrik vektörler, yapay zeka ve yüz tanıma teknolojisinin çalışma prensipleri. Karmaşık algoritmaların basit anlatımı.",
            "content_html": """
                <p>Yüz tanıma, bir görüntüdeki yüzü analiz ederek matematiksel bir harita (vektör) çıkaran teknolojidir. Peki, bu süreç tam olarak nasıl işler?</p>
                <h2>Pikselden Vektöre</h2>
                <p>Sistem, göz bebekleri arasındaki mesafe, burun yapısı ve çene hattı gibi benzersiz noktaları ölçer. Bu ölçümler, insan gözünün ayırt edemeyeceği detayları yakalar.</p>
            """
        },
        {
            "title": "İnternette Görsel Arama Yapmanın Püf Noktaları",
            "slug": "internette-gorsel-arama-ipuclari",
            "excerpt": "Daha doğru sonuçlar için görsel arama yaparken dikkat etmeniz gerekenler. Işık, açı ve çözünürlüğün önemi.",
            "content_html": """
                <p>Başarılı bir yüz araması yapmak için doğru görseli seçmek çok önemlidir. <strong>Görsel arama</strong> teknolojisinden en iyi verimi almak için şu ipuçlarına dikkat edin:</p>
                <ul>
                    <li><strong>Yüksek Çözünürlük:</strong> Bulanık fotoğraflar sonuç kalitesini düşürür.</li>
                    <li><strong>Doğru Işık:</strong> Yüzün net göründüğü, gölgesiz fotoğraflar tercih edin.</li>
                    <li><strong>Tek Kişi:</strong> Mümkünse sadece aradığınız kişinin olduğu kareleri kullanın.</li>
                </ul>
            """
        },
        {
            "title": "Siber Güvenlik Farkındalığı: Kendinizi Nasıl Korursunuz?",
            "slug": "siber-guvenlik-farkindaligi",
            "excerpt": "Dijital ayak izinizi yönetmek ve siber tehditlere karşı korunmak için temel siber güvenlik önlemleri.",
            "content_html": """
                <p>Her paylaştığınız fotoğraf, dijital ayak izinizin bir parçasıdır. <strong>Siber güvenlik farkındalığı</strong>, bu izleri kontrol altında tutmanızı sağlar.</p>
                <h2>Sosyal Mühendislik Saldırıları</h2>
                <p>Kötü niyetli kişiler, halka açık fotoğraflarınızı kullanarak size karşı güven oluşturmaya çalışabilir. FaceSeek ile fotoğraflarınızın izinsiz kullanılıp kullanılmadığını kontrol edebilirsiniz.</p>
            """
        },
        {
            "title": "Biyometrik Veri Güvenliği: Geleceğin Anahtarı",
            "slug": "biyometrik-veri-guvenligi",
            "excerpt": "Parmak izi, yüz tanıma ve iris tarama gibi biyometrik verilerin güvenliği neden önemlidir? Geleneksel şifrelerin sonu mu?",
            "content_html": """
                <p>Şifrelerinizi unutabilirsiniz, ama yüzünüzü asla. <strong>Biyometrik veri güvenliği</strong>, kullanım kolaylığı ile yüksek güvenliği birleştiriyor.</p>
                <p>Ancak biyometrik veriler değiştirilemez. Bu yüzden FaceSeek, biyometrik verilerinizi asla sunucularında saklamaz.</p>
            """
        },
        {
            "title": "Yapay Zeka ve Etik: Sorumlu Teknoloji Kullanımı",
            "slug": "yapay-zeka-ve-etik",
            "excerpt": "Yapay zeka teknolojilerinin gelişiminde etik kuralların önemi. FaceSeek'in sorumlu AI yaklaşımı.",
            "content_html": """
                <p>Güçlü teknoloji, büyük sorumluluk gerektirir. <strong>Yapay zeka ve etik</strong>, FaceSeek'in geliştirme sürecinin merkezinde yer alır.</p>
                <p>Algoritmalarımızı önyargılardan arındırmak ve herkes için adil bir teknoloji sunmak için sürekli çalışıyoruz.</p>
            """
        },
        {
            "title": "OSINT Nedir? Açık Kaynak İstihbaratı Rehberi",
            "slug": "osint-nedir-rehber",
            "excerpt": "Open Source Intelligence (OSINT) dünyasına giriş. Halka açık verileri analiz ederek bilgiye ulaşma sanatı.",
            "content_html": """
                <p><strong>OSINT (Açık Kaynak İstihbaratı)</strong>, siber güvenlik uzmanlarının, gazetecilerin ve araştırmacıların kullandığı güçlü bir yöntemdir. FaceSeek, görsel OSINT alanında size yardımcı olan gelişmiş bir araçtır.</p>
                <p>İnternetteki milyarlarca görsel arasında saniyeler içinde arama yaparak, aradığınız bilgiye en hızlı şekilde ulaşmanızı sağlıyoruz.</p>
            """
        }
    ]

    posts_en = [
        {
            "title": "Data Security Solutions: A New Era in Facial Recognition",
            "slug": "data-security-solutions-facial-recognition",
            "excerpt": "Discover FaceSeek's innovative data security solutions in biometric security systems and personal data protection.",
            "content_html": """
                <p>The need for identity verification and security in the digital world is increasing every day. <strong>Data security solutions</strong> are vital, especially in systems where biometric data is processed. At FaceSeek, we adopt the "Zero-Knowledge" principle to keep our users' security at the highest level.</p>
                <h2>Security Standards in Biometric Data</h2>
                <p>Although facial recognition technologies are much more secure than traditional encryption methods, storing this data carries great risks. This is where FaceSeek makes a difference in the sector by never permanently storing your visual data.</p>
                <h3>Why FaceSeek?</h3>
                <ul>
                    <li><strong>Instant Processing:</strong> Images are processed only at the moment of analysis.</li>
                    <li><strong>GDPR Compliance:</strong> Infrastructure fully compliant with international data protection laws.</li>
                    <li><strong>High Encryption:</strong> All data is protected with AES-256.</li>
                </ul>
                <p>You can visit our <a href="/en/legal/about">About Us</a> page for more information about future security technologies.</p>
            """
        },
        {
            "title": "Legal Compliance Consulting and OSINT Tools",
            "slug": "legal-compliance-consulting-osint",
            "excerpt": "The importance of getting legal compliance consulting when using Open Source Intelligence (OSINT) tools and what to watch out for.",
            "content_html": """
                <p>Collecting information from open sources on the internet (OSINT) is an indispensable method for researchers and security experts. However, it is necessary to pay attention to <strong>legal compliance consulting</strong> principles in this process.</p>
                <h2>Legal Boundaries and Ethical Use</h2>
                <p>Searching for a person's photo can be considered a "personal data processing" activity under GDPR. FaceSeek offers tools to help you keep these processes completely within legal limits.</p>
                <p>We recommend reviewing our <a href="/en/legal/terms">Terms of Service</a> page for detailed information about ethical use and legal responsibilities.</p>
            """
        },
        {
            "title": "Digital Identity Verification: Fighting Fraud",
            "slug": "digital-identity-verification-fraud",
            "excerpt": "Digital identity verification methods and anti-fraud strategies to increase security on online platforms.",
            "content_html": """
                <p>Internet fraud is one of the biggest cyber threats of our time. <strong>Digital identity verification</strong> systems are the most effective defense mechanism against these threats.</p>
                <h2>Detecting Fake Profiles</h2>
                <p>Catfishing and creating fake profiles are problems that social media users frequently encounter. FaceSeek's advanced algorithms detect within seconds if a photo is being used elsewhere on the internet.</p>
            """
        },
        {
            "title": "What is GDPR? Data Protection Explained",
            "slug": "what-is-gdpr-data-protection",
            "excerpt": "Everything you need to know about General Data Protection Regulation. Your rights and data controllers' obligations.",
            "content_html": """
                <p>The <strong>General Data Protection Regulation (GDPR)</strong> is designed to protect individuals' fundamental rights and freedoms. As FaceSeek, we have made all our processes fully compliant with this law.</p>
                <h2>Who is the Data Controller?</h2>
                <p>The data controller is the person who determines the purposes and means of processing personal data. The data you share with us is processed only for the specified purposes and with the principle of transparency.</p>
                <p>You can reach our detailed privacy policy <a href="/en/legal/privacy">here</a>.</p>
            """
        },
        {
            "title": "How Does Facial Recognition Technology Work?",
            "slug": "how-facial-recognition-works",
            "excerpt": "Working principles of biometric vectors, AI, and facial recognition technology. Simple explanation of complex algorithms.",
            "content_html": """
                <p>Facial recognition is a technology that analyzes a face in an image and extracts a mathematical map (vector). So, how exactly does this process work?</p>
                <h2>From Pixel to Vector</h2>
                <p>The system measures unique points such as the distance between pupils, nose structure, and jawline. These measurements capture details that the human eye cannot distinguish.</p>
            """
        },
        {
            "title": "Tips for Visual Search on the Internet",
            "slug": "tips-for-visual-search",
            "excerpt": "Things to watch out for when doing visual search for more accurate results. Importance of light, angle, and resolution.",
            "content_html": """
                <p>Choosing the right image is very important for a successful face search. Pay attention to these tips to get the best efficiency from <strong>visual search</strong> technology:</p>
                <ul>
                    <li><strong>High Resolution:</strong> Blurry photos reduce result quality.</li>
                    <li><strong>Correct Light:</strong> Prefer photos where the face is clearly visible and without shadows.</li>
                    <li><strong>Single Person:</strong> If possible, use frames where only the person you are looking for is present.</li>
                </ul>
            """
        },
        {
            "title": "Cybersecurity Awareness: How to Protect Yourself?",
            "slug": "cybersecurity-awareness",
            "excerpt": "Basic cybersecurity measures to manage your digital footprint and protect against cyber threats.",
            "content_html": """
                <p>Every photo you share is part of your digital footprint. <strong>Cybersecurity awareness</strong> allows you to keep these traces under control.</p>
                <h2>Social Engineering Attacks</h2>
                <p>Malicious people may try to build trust with you using your publicly available photos. With FaceSeek, you can check if your photos are being used without permission.</p>
            """
        },
        {
            "title": "Biometric Data Security: Key to the Future",
            "slug": "biometric-data-security",
            "excerpt": "Why is the security of biometric data such as fingerprints, facial recognition, and iris scanning important? Is it the end of traditional passwords?",
            "content_html": """
                <p>You can forget your passwords, but never your face. <strong>Biometric data security</strong> combines ease of use with high security.</p>
                <p>However, biometric data cannot be changed. That's why FaceSeek never stores your biometric data on its servers.</p>
            """
        },
        {
            "title": "AI and Ethics: Responsible Technology Use",
            "slug": "ai-and-ethics",
            "excerpt": "The importance of ethical rules in the development of AI technologies. FaceSeek's responsible AI approach.",
            "content_html": """
                <p>Powerful technology requires great responsibility. <strong>AI and ethics</strong> are at the center of FaceSeek's development process.</p>
                <p>We are constantly working to purge our algorithms of biases and offer a fair technology for everyone.</p>
            """
        },
        {
            "title": "What is OSINT? Open Source Intelligence Guide",
            "slug": "what-is-osint-guide",
            "excerpt": "Introduction to the world of Open Source Intelligence (OSINT). The art of reaching information by analyzing publicly available data.",
            "content_html": """
                <p><strong>OSINT (Open Source Intelligence)</strong> is a powerful method used by cybersecurity experts, journalists, and researchers. FaceSeek is an advanced tool that helps you in the field of visual OSINT.</p>
                <p>We allow you to reach the information you are looking for in the fastest way by searching among billions of images on the internet in seconds.</p>
            """
        }
    ]

    for post_data in posts_tr:
        exists = db.query(BlogPost).filter(BlogPost.slug == post_data["slug"]).first()
        if not exists:
            post = BlogPost(
                locale="tr",
                slug=post_data["slug"],
                title=post_data["title"],
                excerpt=post_data["excerpt"],
                content_html=post_data["content_html"],
                is_published=True,
                author_name="FaceSeek Editör",
                published_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(post)
            print(f"Added TR post: {post.title}")

    for post_data in posts_en:
        exists = db.query(BlogPost).filter(BlogPost.slug == post_data["slug"]).first()
        if not exists:
            post = BlogPost(
                locale="en",
                slug=post_data["slug"],
                title=post_data["title"],
                excerpt=post_data["excerpt"],
                content_html=post_data["content_html"],
                is_published=True,
                author_name="FaceSeek Editor",
                published_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(post)
            print(f"Added EN post: {post.title}")
    
    try:
        db.commit()
        print("Successfully seeded blog posts.")
    except Exception as e:
        print(f"Error seeding posts: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_blog_posts()

