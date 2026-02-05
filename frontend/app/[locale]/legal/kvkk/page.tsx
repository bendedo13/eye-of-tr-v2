import LegalLayout from "../../../legal_layout_provider";
import { use } from "react";

export default function KVKKPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    
    // In a real app, you'd use a translation library here.
    // Since the user specifically requested Turkish KVKK compliance, 
    // we are providing the detailed Turkish text.
    
    return (
        <LegalLayout>
            <div className="space-y-10 font-sans">
                <section>
                    <h1 className="text-3xl font-black mb-2 text-white">KİŞİSEL VERİLERİN KORUNMASI VE İŞLENMESİ HAKKINDA AYDINLATMA METNİ</h1>
                    <p className="text-face-seek-cyan text-xs font-black uppercase tracking-widest mb-6">Son Güncelleme: 5 Şubat 2026</p>
                    <p className="text-zinc-300 leading-relaxed">
                        <strong>Veri Sorumlusu:</strong> FaceSeek (Bundan sonra "Şirket" olarak anılacaktır)<br/><br/>
                        6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, kişisel verileriniz; veri sorumlusu sıfatıyla Şirketimiz tarafından aşağıda açıklanan kapsamda işlenebilecektir.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white border-l-4 border-face-seek-cyan pl-4">1. Kişisel Verilerin İşlenme Amacı</h2>
                    <p className="text-zinc-400">
                        Toplanan kişisel verileriniz (Kimlik, İletişim, İşlem Güvenliği ve Biyometrik Veri - Yüz Vektörü);
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                        <li>Kullanıcı üyeliğinin oluşturulması ve doğrulanması,</li>
                        <li>Yüz tanıma teknolojisi kullanılarak açık kaynak (OSINT) taramalarının yapılması,</li>
                        <li>Sistem güvenliğinin sağlanması ve yetkisiz işlemlerin (dolandırıcılık/abuse) engellenmesi,</li>
                        <li>Yasal yükümlülüklerin yerine getirilmesi,</li>
                    </ul>
                    <div className="bg-face-seek-dark-slate/50 p-4 rounded-lg border border-face-seek-cyan/20">
                        <p className="text-sm text-zinc-300">
                            <strong>Önemli Not:</strong> Yüklediğiniz fotoğraflar, yalnızca biyometrik vektörlerin çıkarılması ve arama işleminin gerçekleştirilmesi amacıyla <strong>anlık ve geçici (transient)</strong> olarak işlenir. Şirketimiz, kullanıcılar tarafından yüklenen yüz görsellerini kalıcı bir veri tabanında <strong>saklamamaktadır</strong>.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white border-l-4 border-face-seek-cyan pl-4">2. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
                    <p className="text-zinc-400">
                        Kişisel verileriniz, web sitemiz üzerinden fotoğraf yüklemeniz ve form doldurmanız suretiyle tamamen otomatik yollarla elde edilmektedir. Bu işlemeler KVKK Madde 5 ve Madde 6 kapsamında aşağıdaki hukuki sebeplere dayanmaktadır:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                        <li><strong>Bir sözleşmenin kurulması veya ifası:</strong> Üyelik sözleşmesi ve hizmetin sunulması (arama işleminin yapılması).</li>
                        <li><strong>Veri sorumlusunun meşru menfaati:</strong> Sistem güvenliği ve hizmet kalitesinin artırılması.</li>
                        <li><strong>Açık Rıza:</strong> Biyometrik verilerinizin (yüz haritası/vektörü) işlenmesi için açık rızanız talep edilmektedir.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white border-l-4 border-face-seek-cyan pl-4">3. İşlenen Verilerin Kimlere ve Hangi Amaçla Aktarılabileceği</h2>
                    <p className="text-zinc-400">
                        Kişisel verileriniz;
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                        <li>Yasal yükümlülüklerimizi yerine getirmek üzere yetkili kamu kurum ve kuruluşlarına,</li>
                        <li>Hizmetin teknik altyapısını sağlayan (sunucu, bulut bilişim) tedarikçilerimize,</li>
                    </ul>
                    <p className="text-zinc-400 mt-2 italic">
                        Arama işlemi sırasında görselleriniz Google, Bing, Yandex gibi halka açık arama motorlarında taranır, ancak bu platformlara doğrudan kimlik bilgileriniz satılmaz veya devredilmez.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white border-l-4 border-face-seek-cyan pl-4">4. İlgili Kişinin Hakları (KVKK Madde 11)</h2>
                    <p className="text-zinc-400">
                        Kişisel veri sahipleri olarak; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, verilerin silinmesini veya yok edilmesini isteme ve zararın giderilmesini talep etme haklarına sahipsiniz.
                    </p>
                    <p className="text-zinc-400">
                        Bu haklarınızı kullanmak için taleplerinizi <a href="mailto:privacy@face-seek.com" className="text-face-seek-cyan hover:underline">privacy@face-seek.com</a> adresine iletebilirsiniz.
                    </p>
                </section>

                <section className="bg-face-seek-dark-slate p-6 rounded-2xl border border-white/5 mt-8">
                     <h3 className="text-lg font-bold text-white mb-2">Çerez Politikası Hakkında</h3>
                     <p className="text-zinc-400 text-sm">
                         Hizmetlerimizi sunmak ve kullanıcı deneyimini geliştirmek amacıyla çerezler kullanmaktayız. Detaylı bilgi için <a href={`/${locale}/legal/privacy`} className="text-face-seek-cyan hover:underline">Gizlilik Politikası</a> sayfamızı inceleyebilirsiniz.
                     </p>
                </section>
            </div>
        </LegalLayout>
    );
}
