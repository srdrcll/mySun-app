# ☀️ mySun — Kişisel Sağlıklı Yaşam Takip Uygulaması

mySun, günlük su tüketimini, alışkanlıkları, ruh halini ve uyku düzenini takip etmeni sağlayan yerel, çevrimdışı çalışan bir mobil wellness uygulamasıdır.

---

## Özellikler

| Modül | Açıklama |
|---|---|
| 💧 Su Takibi | Günlük su tüketimi, hedef ayarı, hatırlatıcılar |
| 🌱 Alışkanlıklar | Özel alışkanlık oluşturma, haftalık tekrar, tamamlama takibi |
| 🧠 Ruh Hali | Günlük mood kaydı, mini günlük notlar |
| 😴 Uyku | Uyku süresi ve kalite takibi |
| 📊 İstatistikler | 7 / 30 / 90 günlük grafikler ve özet |
| 📅 Takvim | Geçmiş günlere tarih bazlı erişim |
| 💌 Senin İçin | Kişiselleştirilmiş günlük mesajlar |
| 🔔 Bildirimler | Su ve alışkanlık hatırlatıcıları |
| ⚙️ Profil & Ayarlar | Hedef ayarları, tema, veri dışa aktarma, sıfırlama |

---

## Teknolojiler

- **React Native** 0.81.5
- **Expo** SDK ~54.0.0
- **TypeScript** ~5.9.2
- **Zustand** + AsyncStorage (offline-first state)
- **expo-notifications** (yerel bildirimler)
- **react-native-svg** (animasyonlu SVG bileşenler)

---

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Environment değişkenlerini ayarla (opsiyonel — Supabase şu an kullanılmıyor)
cp .env.example .env
```

---

## Geliştirme Ortamı

```bash
# Expo Dev Server'ı başlat
npm start

# Tarayıcıda çalıştır (web preview)
npm run web

# Android (Expo Go veya fiziksel cihaz)
npm run android

# iOS (Mac + Xcode gerekli)
npm run ios
```

---

## Environment Variables

| Değişken | Açıklama | Gerekli mi? |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase proje URL'i | Hayır (gelecekte cloud sync için) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | Hayır |

> ⚠️ `.env` dosyasını Git'e commit etme. `.env.example` şablonu mevcuttur.

---

## Android Build (EAS)

```bash
# EAS CLI kur (ilk kurulumda)
npm install -g eas-cli

# EAS'a giriş yap
eas login

# Preview APK oluştur (gerçek cihaz testi için)
eas build --platform android --profile preview

# Production AAB oluştur (Play Store için)
eas build --platform android --profile production
```

> **Not**: İlk build öncesinde `eas.json` içindeki `projectId` değerini `eas init` ile güncellemeniz gerekir.

---

## iOS Build (EAS)

```bash
# Preview IPA oluştur
eas build --platform ios --profile preview

# Production IPA oluştur (App Store için)
eas build --platform ios --profile production
```

> **Not**: iOS build için Apple Developer hesabı gereklidir.

---

## Uygulama Adını Değiştirmek

Uygulama adını değiştirmek için şu dosyaları güncelle:

| Dosya | Alan |
|---|---|
| `app.json` | `expo.name`, `expo.slug` |
| `app.json` | `expo.ios.bundleIdentifier` |
| `app.json` | `expo.android.package` |
| `package.json` | `name` |
| `src/constants/appConfig.ts` | Tüm alanlar |

---

## Proje Yapısı

```
mySun/
├── App.tsx                        # Kök bileşen, routing, ErrorBoundary
├── app.json                       # Expo konfigürasyonu
├── eas.json                       # EAS Build profilleri
├── assets/                        # Uygulama ikonları ve splash
└── src/
    ├── components/                # Paylaşılan UI bileşenleri
    │   ├── AppHeader.tsx
    │   ├── BottomNavBar.tsx
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── ErrorBoundary.tsx
    │   └── ...
    ├── constants/
    │   ├── appConfig.ts           # Merkezi uygulama sabitleri
    │   └── theme.ts               # Tasarım sistemi (light/dark)
    ├── features/                  # Modül bazlı özellikler
    │   ├── calendar/
    │   ├── dashboard/
    │   ├── habits/
    │   ├── mood/
    │   ├── sleep/
    │   ├── specialMessages/
    │   ├── statistics/
    │   └── water/
    ├── screens/                   # Tam sayfa bileşenler
    ├── services/
    │   ├── notifications/         # Bildirim servisi
    │   └── supabase.ts            # Gelecekte cloud sync için
    ├── store/
    │   └── useWellnessStore.ts    # Zustand global state
    ├── types/                     # TypeScript tipleri
    └── utils/                     # Yardımcı fonksiyonlar (date, vb.)
```

---

## Mimari Notlar

- **Navigasyon**: React Navigation veya Expo Router kullanılmamaktadır. Navigasyon `App.tsx` içinde manuel state machine ile yönetilmektedir.
- **Veri**: Tamamen local-first. Tüm veriler AsyncStorage üzerinden Zustand persist ile saklanır.
- **Bildirimler**: Sadece yerel bildirimler (expo-notifications). Push notification altyapısı yoktur.
- **Backend**: Supabase entegrasyonu hazırlanmış ancak henüz aktif kullanılmamaktadır.

---

## Lisans

Özel kullanım için geliştirilmiştir.
