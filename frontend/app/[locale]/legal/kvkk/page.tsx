import LegalLayout from "../../../legal_layout_provider";

import { use } from "react";

export default function KVKKPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    return (
        <LegalLayout>
            <div className="space-y-10">
                <section>
                    <h1>KVKK Aydınlatma Metni</h1>
                    <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-6">Son Güncelleme: 3 Şubat 2026</p>
                    <p>
                        FaceSeek olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla kişisel verilerinizin işlenmesi hususunda azami hassasiyet göstermekteyiz.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black underline decoration-primary">1. VERİ İŞLEME AMAÇLARIMIZ</h2>
                    <p>
                        Kişisel verileriniz aşağıdaki amaçlarla sınırlı olarak işlenmektedir:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-500">
                        <li>Kullanıcı hesaplarının oluşturulması ve doğrulanması.</li>
                        <li>Yüz arama motoru üzerinden açık kaynak istihbarat sorgularının gerçekleştirilmesi.</li>
                        <li>Sistem güvenliğinin sağlanması ve suistimallerin önlenmesi.</li>
                        <li>Ücretli servisler için faturalandırma ve ödeme süreçlerinin yönetimi.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-black">2. İLGİLİ KİŞİ HAKLARI</h2>
                    <p>
                        KVKK'nın 11. maddesi uyarınca herkes veri sorumlusuna başvurarak kendisiyle ilgili; kişisel veri işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme ve verilerin silinmesini isteme hakkına sahiptir.
                    </p>
                </section>

                <section className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 leading-relaxed">
                        FaceSeek, üçüncü taraf web sitelerinde bulunan halka açık verileri indeksleyen bir arama motoru teknolojisidir. Veritabanımızda Türkiye Cumhuriyeti vatandaşlarına ait özel, gizli veya hukuka aykırı bir biyometrik arşiv tutulmamaktadır.
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
