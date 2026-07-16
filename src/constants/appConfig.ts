/**
 * Merkezi Uygulama Konfigürasyonu
 *
 * Uygulama adını, sürümünü ve bundle identifier'ı değiştirmek için bu dosyayı
 * ve app.json'ı birlikte düzenlemeniz yeterlidir.
 *
 * YAYINDAN ÖNCE DEĞİŞTİRİLMESİ GEREKEN ALANLAR:
 * ------------------------------------------------
 * 1. APP_NAME          → app.json > expo.name ile eşleşmeli
 * 2. APP_SLUG          → app.json > expo.slug ile eşleşmeli (değiştirmesi EAS bağlantısını koparır!)
 * 3. BUNDLE_ID         → app.json > expo.ios.bundleIdentifier ile eşleşmeli
 * 4. ANDROID_PACKAGE   → app.json > expo.android.package ile eşleşmeli
 * 5. APP_VERSION       → app.json > expo.version ile eşleşmeli
 */

export const APP_CONFIG = {
  /** Kullanıcıya gösterilen uygulama adı */
  APP_NAME: 'mySun',

  /** Expo slug — EAS ile proje bağlantısı için kullanılır, değiştirme! */
  APP_SLUG: 'mySun',

  /** iOS Bundle Identifier (App Store'da benzersiz olmalı) */
  BUNDLE_ID: 'com.serdar.mysun',

  /** Android Package Name (Play Store'da benzersiz olmalı) */
  ANDROID_PACKAGE: 'com.serdar.mysun',

  /** Kullanıcıya görünen sürüm */
  APP_VERSION: '1.0.0',

  /** Android versionCode (her yeni build'de +1 artır) */
  ANDROID_VERSION_CODE: 1,

  /** iOS buildNumber (her yeni build'de artır) */
  IOS_BUILD_NUMBER: '1',

  /** Android bildirim kanalı ID */
  NOTIFICATION_CHANNEL_ID: 'wellness-reminders',

  /** Android bildirim kanalı görünen adı */
  NOTIFICATION_CHANNEL_NAME: 'Sağlıklı Yaşam Hatırlatıcıları',
} as const;
