```tsx
import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-4">FaceSeek</h3>
            <p className="text-sm">AI destekli yüz tanıma ve kişi bulma platformu</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Bağlantılar</h3>
            <ul className="text-sm space-y-2">
              <li><a href="#" className="hover:text-white transition">Ana Sayfa</a></li>
              <li><a href="#" className="hover:text-white transition">Gizlilik Politikası</a></li>
              <li><a href="#" className="hover:text-white transition">Kullanım Şartları</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">İletişim</h3>
            <ul className="text-sm space-y-2">
              <li>Email: info@faceseek.com</li>
              <li>GitHub: github.com/bendedo13/eye-of-tr-v2</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-sm">
            &copy; 2026 FaceSeek. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
};
```

### AÇIKLAMA:
Footer bileşenine 2026 yılı için copyright yazısı eklendi. Alt kısımda border ile ayrılan bölümde "&copy; 2026 FaceSeek. Tüm hakları saklıdır." metni gösterilmektedir. Tasarım mevcut grid yapısını koruyarak, merkez hizalanmış ve responsive bir copyright alanı sağlamaktadır.