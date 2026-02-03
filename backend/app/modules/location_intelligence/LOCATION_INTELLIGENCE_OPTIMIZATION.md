## FaceSeek – Location Intelligence: %95+ Başarı için Teknik İyileştirme Dokümanı

Bu doküman, mevcut modüler mimari korunarak Location Intelligence’ın doğruluk ve güvenilirliğinin artırılması için teknik seçenekleri açıklar. Bu öneriler **onayınız olmadan** koda entegre edilmemelidir.

### 1) Hedef Tanımı (Net KPI)
- **KPI-1 (Binary suitability):** “Uygunluk etiketi” (evet/hayır) doğruluğu ≥ %95
- **KPI-2 (Calibration):** Tahmin güven skorunun (0–1) kalibrasyonu (Expected Calibration Error düşürme)
- **KPI-3 (Robustness):** Bulanık/kapalı alan/AI üretimi görsellerde hatalı “evet” oranını minimize etme

### 2) Veri Stratejisi (En Kritik Adım)
- **Etiketleme:** En az 5–10k görsel ile “evet/hayır” suitability etiketi
  - “Evet”: dış ortam ipuçları (gökyüzü/bitki/yol/işaret/mimari/ufuk) bariz
  - “Hayır”: kapalı alan, çok yakın kadraj, aşırı bulanık, tek renk, AI/illüstrasyon ağırlıklı
- **Zorluk katmanlama:** kolay/orta/zor (ışık, açı, hava, çözünürlük, motion blur)
- **Veri sızıntısı önleme:** aynı sahnenin varyantlarını train/val/test’e ayırma (scene-level split)

### 3) Veri Artırma (Augmentation)
Amaç: gerçek dünyadaki değişkenlikleri simüle ederek genelleme kabiliyetini artırmak.
- Geometrik: rotation (±10°), random crop/zoom, horizontal flip
- Fotometrik: brightness/contrast, color jitter, gamma, blur/noise ekleme
- Optik bozulmalar: motion blur, JPEG artifacts, vignetting
- Koşullu artırma: “zor” sınıf için daha agresif blur/noise

### 4) Transfer Learning (Önerilen Ana Yol)
Suitability gibi görüntü sınıflandırmalarında en iyi maliyet/performans genelde transfer learning ile gelir.
- **Ön-eğitimli backbone:** EfficientNet / MobileNet / ViT-tiny sınıfı modeller
- **Fine-tuning planı:**
  - İlk aşama: sadece classifier head eğit
  - İkinci aşama: üst katmanları açıp düşük LR ile fine-tune
  - Class imbalance varsa weighted loss / focal loss
- **Çıktı:** `p(evet)` olasılığı + kalibre edilmiş confidence (temperature scaling)

### 5) Ensemble Learning (Üst Limit Performans)
Tek model yerine birden fazla modelin ortalaması hataları azaltabilir.
- 2–3 farklı backbone (örn. EfficientNet + ViT) ensemble
- TTA (test-time augmentation) ile stable skor
- Trade-off: latency artar; backend’de feature flag ile açılmalı

### 6) Hiperparametre Optimizasyonu
- LR, weight decay, batch size, augmentation şiddeti, early stopping
- Pratik yaklaşım: Bayesian optimization veya küçük grid search
- Hedef: val accuracy + calibration birlikte optimize edilmeli

### 7) Cross-Validation ve Değerlendirme
- 5-fold CV (scene-level split)
- Metrikler:
  - Accuracy, Precision/Recall (özellikle “evet” yanlış pozitifler kritik)
  - ROC-AUC
  - Calibration: ECE, reliability diagram
  - Zorluk bazlı raporlama: kolay/zor ayrımı

### 8) Üretim Mimarisi (Mevcut Mimarinin Bozulmaması)
- Yeni model/servis, `app/modules/location_intelligence/` altında ayrı bir provider olarak konumlandırılmalı
- Feature flag ile aktif/pasif
- Model dosyaları:
  - local path veya ayrı model registry (versiyonlu)
- Gözlemlenebilirlik:
  - Anonim metrikler (güven dağılımı, hata oranları)
  - Görsel saklamadan sadece teknik özet istatistikler

### 9) Entegrasyon İçin Onay Bekleyen Aksiyon Listesi
- Dataset ve etiketleme şeması netleştirme
- Model seçimi ve eğitim pipeline’ı
- Kalibrasyon ve robust test setleri
- API sözleşmesine “uygunluk_confidence_0_1” gibi net alan ekleme (frontend uyumu)

