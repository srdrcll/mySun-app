import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { requestNotificationPermission } from '../services/notifications/notificationService';
import { AppHeader } from '../components/AppHeader';
import { getCalculatedBadges } from '../features/gamification/utils/badgeHelpers';
import { calculateProfileStats } from '../features/gamification/utils/profileStats';
import { SpinningSun } from '../components/SpinningSun';

interface ProfileScreenProps {
  onNavigateToStats: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigateToStats }) => {
  const store = useWellnessStore();
  const currentTheme = store.theme;
  const colors = theme[currentTheme].colors;

  const calculatedBadges = getCalculatedBadges(store);
  const { monthly: monthlyStats, yearly: yearlyStats } = calculateProfileStats(store);

  // Profile View / Settings toggle state
  const [showSettings, setShowSettings] = useState(false);

  // Personal Settings states
  const [username, setUsername] = useState(store.username);
  const [waterTarget, setWaterTarget] = useState(String(store.waterTarget));
  const [wakeUpTime, setWakeUpTime] = useState(store.wakeUpTime);
  const [sleepTime, setSleepTime] = useState(store.sleepTime);

  // Water Reminder states
  const [remindersEnabled, setRemindersEnabled] = useState(store.waterReminderSettings.enabled);
  const [reminderInterval, setReminderInterval] = useState(String(store.waterReminderSettings.intervalMinutes));
  const [reminderStart, setReminderStart] = useState(store.waterReminderSettings.startTime);
  const [reminderEnd, setReminderEnd] = useState(store.waterReminderSettings.endTime);

  // Export & Confirm Wipe states
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState('');
  const [wipeStep, setWipeStep] = useState(0); // 0: none, 1: step 1, 2: step 2

  // Saving settings
  const handleSaveProfile = () => {
    const parsedWater = parseInt(waterTarget, 10);
    if (!username.trim()) {
      Alert.alert('Hata', 'Lütfen geçerli bir isim girin.');
      return;
    }
    if (isNaN(parsedWater) || parsedWater <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir su hedefi girin.');
      return;
    }
    
    // Time regex validation (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(wakeUpTime) || !timeRegex.test(sleepTime)) {
      Alert.alert('Hata', 'Lütfen saatleri HH:MM formatında girin.');
      return;
    }

    store.setUsername(username);
    store.setWaterTarget(parsedWater);
    store.setWakeUpTime(wakeUpTime);
    store.setSleepTime(sleepTime);
    
    Alert.alert('Başarılı', 'Profil bilgileri kaydedildi. 🌸');
  };

  // Toggle water alarms trigger
  const handleToggleWaterReminders = async () => {
    const nextVal = !remindersEnabled;
    
    if (nextVal) {
      // Prompt permissions first
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Bildirim İzni Reddedildi',
          'Su hatırlatıcılarını aktif edebilmek için cihaz ayarlarınızdan bildirim izinlerini açmanız gerekmektedir.'
        );
        return;
      }
    }

    setRemindersEnabled(nextVal);
    store.updateWaterReminderSettings({ enabled: nextVal });
  };

  const handleSaveWaterReminders = async () => {
    const parsedInterval = parseInt(reminderInterval, 10);
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (isNaN(parsedInterval) || parsedInterval <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir hatırlatma aralığı seçin.');
      return;
    }
    if (!timeRegex.test(reminderStart) || !timeRegex.test(reminderEnd)) {
      Alert.alert('Hata', 'Saatleri HH:MM formatında girin.');
      return;
    }

    await store.updateWaterReminderSettings({
      enabled: remindersEnabled,
      intervalMinutes: parsedInterval,
      startTime: reminderStart,
      endTime: reminderEnd,
    });

    Alert.alert('Başarılı', 'Hatırlatıcı ayarları güncellendi. 💧');
  };

  // Generate data export JSON
  const handleExportData = () => {
    const payload = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        username: store.username,
        waterTarget: store.waterTarget,
        sleepTarget: store.sleepTarget,
        wakeUpTime: store.wakeUpTime,
        sleepTime: store.sleepTime,
        theme: store.theme,
      },
      waterReminderSettings: store.waterReminderSettings,
      habits: store.habits,
      habitCompletions: store.habitCompletions,
      moodEntries: store.moodEntries,
      sleepEntries: store.sleepEntries,
      appUsageDays: store.appUsageDays,
      readMessageIds: store.readMessageIds,
      favoriteMessageIds: store.favoriteMessageIds,
      easterEggUnlocked: store.easterEggUnlocked,
    };

    setExportData(JSON.stringify(payload, null, 2));
    setShowExport(true);
  };

  // Perform full data wipe
  const handleResetConfirm = () => {
    store.resetAllData();
    setWipeStep(0);
    Alert.alert('Temizlendi', 'Tüm verileriniz silindi ve uygulama sıfırlandı.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Custom Contextual Header */}
      <View style={[styles.customHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {!showSettings ? (
          <>
            <View style={styles.logoRow}>
              <SpinningSun size={22} color={colors.primary} />
              <Text style={[styles.logoText, { color: colors.text }]}>mySun</Text>
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Profilim</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSettings(true)}
              style={[styles.headerActionBtn, { backgroundColor: colors.backgroundSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Ayarları Aç"
            >
              <Text style={styles.headerActionIcon}>⚙️</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setShowSettings(false);
                setWipeStep(0);
                setShowExport(false);
              }}
              style={styles.backBtn}
            >
              <Text style={[styles.backBtnText, { color: colors.primary }]}>← Geri</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Ayarlar</Text>
            <View style={{ width: 60 }} />
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!showSettings ? (
          /* SOCIAL MEDIA STYLE PROFILE VIEW */
          <View style={styles.profileContainer}>
            
            {/* Profile Card Header */}
            <Card style={styles.profileHeaderCard}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                  {store.username ? store.username.trim().charAt(0).toUpperCase() : 'S'}
                </Text>
              </View>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {store.username || 'Kullanıcı'}
              </Text>
              <Text style={[styles.profileBio, { color: colors.textSecondary }]}>
                Kendine iyi bakma yolculuğunda. ☀️
              </Text>

              {/* Target Pills Row */}
              <View style={styles.pillsRow}>
                <View style={[styles.targetPill, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
                  <Text style={[styles.targetPillText, { color: colors.info }]}>
                    💧 {store.waterTarget} ml Hedef
                  </Text>
                </View>
                <View style={[styles.targetPill, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
                  <Text style={[styles.targetPillText, { color: colors.warning }]}>
                    😴 {store.sleepTarget} Saat Hedef
                  </Text>
                </View>
              </View>
            </Card>

            {/* BAŞARI ROZETLERİ */}
            <SectionHeader title="Başarı Rozetlerim 🏆" />
            <Card style={styles.card}>
              <View style={styles.badgesGrid}>
                {calculatedBadges.map((badge) => (
                  <View
                    key={badge.id}
                    style={[
                      styles.badgeItem,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                        opacity: badge.unlocked ? 1 : 0.5,
                      },
                    ]}
                  >
                    <Text style={[styles.badgeIcon, { opacity: badge.unlocked ? 1 : 0.4 }]}>
                      {badge.emoji}
                    </Text>
                    <Text style={[styles.badgeTitle, { color: colors.text }]}>
                      {badge.title}
                    </Text>
                    <Text style={[styles.badgeDesc, { color: colors.textSecondary }]}>
                      {badge.description}
                    </Text>
                    <View
                      style={[
                        styles.badgeStatusIndicator,
                        {
                          backgroundColor: badge.unlocked ? colors.successLight : colors.border,
                          borderColor: badge.unlocked ? colors.success : colors.textSecondary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeStatusText,
                          { color: badge.unlocked ? colors.success : colors.textSecondary },
                        ]}
                      >
                        {badge.unlocked ? 'Açıldı' : 'Kilitli'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/* İSTATİSTİKLER */}
            <SectionHeader title="İstatistiklerim 📊" />
            
            {/* Monthly Stats Card */}
            <Card style={styles.card} onPress={onNavigateToStats}>
              <Text style={[styles.periodStatsTitle, { color: colors.primary }]}>
                Bu Ayki Durum 📅
              </Text>
              <View style={styles.statsList}>
                <View style={styles.statsRow}>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>💧 Toplam Su Tüketimi</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>{monthlyStats.waterLiters} Litre</Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>😴 Uyku Ortalaması</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>{monthlyStats.sleepAverageHours} Saat / Gün</Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>🌱 Alışkanlıklar</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>{monthlyStats.habitCompletionsCount} kez</Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>🎭 Baskın Ruh Hali</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>{monthlyStats.dominantMoodEmoji} {monthlyStats.dominantMoodLabel}</Text>
                </View>
              </View>
            </Card>

            {/* Yearly Stats Card */}
            <Card style={styles.card} onPress={onNavigateToStats}>
              <Text style={[styles.periodStatsTitle, { color: colors.primary }]}>
                Bu Yılki Durum 🗓️
              </Text>
              <View style={styles.statsList}>
                <View style={styles.statsRow}>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>💧 Toplam Su Tüketimi</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>{yearlyStats.waterLiters} Litre</Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>😴 Uyku Ortalaması</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>{yearlyStats.sleepAverageHours} Saat / Gün</Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>🌱 Alışkanlıklar</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>{yearlyStats.habitCompletionsCount} kez</Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>🎭 Baskın Ruh Hali</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>{yearlyStats.dominantMoodEmoji} {yearlyStats.dominantMoodLabel}</Text>
                </View>
              </View>
            </Card>

          </View>
        ) : (
          /* SETTINGS PANEL (FORM VIEWS) */
          <View style={styles.settingsContainer}>
            
            {/* 1. KİŞİSEL AYARLAR */}
            <SectionHeader title="Kişisel Bilgiler 👤" />
            <Card style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Adınız</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="İsminiz"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Kullanıcı adı girişi"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Günlük Su Hedefi (ml)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={waterTarget}
                  onChangeText={setWaterTarget}
                  keyboardType="number-pad"
                  placeholder="2000"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Su hedefi miktarı girişi"
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Uyanma Saati</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                    value={wakeUpTime}
                    onChangeText={setWakeUpTime}
                    placeholder="07:00"
                    placeholderTextColor={colors.textSecondary}
                    accessibilityLabel="Uyanma saati girişi"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Uyuma Saati</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                    value={sleepTime}
                    onChangeText={setSleepTime}
                    placeholder="23:00"
                    placeholderTextColor={colors.textSecondary}
                    accessibilityLabel="Uyuma saati girişi"
                  />
                </View>
              </View>

              <Button title="Bilgileri Kaydet" style={styles.actionBtn} onPress={handleSaveProfile} />
            </Card>

            {/* 2. BİLDİRİMLER */}
            <SectionHeader title="Hatırlatıcı Bildirimler 🔔" />
            <Card style={styles.card}>
              <View style={styles.toggleRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Su Hatırlatıcı Alarmları</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.toggleBtn,
                    {
                      borderColor: remindersEnabled ? colors.primary : colors.border,
                      backgroundColor: remindersEnabled ? colors.primaryLight : 'transparent',
                    },
                  ]}
                  onPress={handleToggleWaterReminders}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: remindersEnabled }}
                >
                  <Text style={[styles.toggleText, { color: remindersEnabled ? colors.primary : colors.textSecondary }]}>
                    {remindersEnabled ? 'AÇIK' : 'KAPALI'}
                  </Text>
                </TouchableOpacity>
              </View>

              {remindersEnabled && (
                <View style={styles.reminderSubConfig}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Hatırlatma Aralığı (Dakika)</Text>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                      value={reminderInterval}
                      onChangeText={setReminderInterval}
                      keyboardType="number-pad"
                      placeholder="120"
                      placeholderTextColor={colors.textSecondary}
                      accessibilityLabel="Su hatırlatıcı dakika aralığı girişi"
                    />
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Başlangıç Saati</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                        value={reminderStart}
                        onChangeText={setReminderStart}
                        placeholder="09:00"
                        placeholderTextColor={colors.textSecondary}
                        accessibilityLabel="Hatırlatıcı başlangıç saati"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Bitiş Saati</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                        value={reminderEnd}
                        onChangeText={setReminderEnd}
                        placeholder="22:00"
                        placeholderTextColor={colors.textSecondary}
                        accessibilityLabel="Hatırlatıcı bitiş saati"
                      />
                    </View>
                  </View>

                  <Button title="Hatırlatıcıları Güncelle" style={styles.actionBtn} onPress={handleSaveWaterReminders} />
                </View>
              )}

              <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Text style={[styles.infoBoxText, { color: colors.textSecondary }]}>
                  💡 Alışkanlık hatırlatıcılarını, **Alışkanlıklar** sayfasında ilgili alışkanlığı düzenleyerek saat bazında aktif/deaktif edebilirsiniz.
                </Text>
              </View>
            </Card>

            {/* 3. TEMA SEÇİCİ */}
            <SectionHeader title="Tema ve Görünüm 🎨" />
            <Card style={styles.card}>
              <View style={styles.themeGrid}>
                {(['light', 'dark'] as const).map((t) => {
                  const active = currentTheme === t;
                  const label = t === 'light' ? 'Açık Tema' : 'Koyu Tema';
                  return (
                    <TouchableOpacity
                      key={t}
                      activeOpacity={0.7}
                      style={[
                        styles.themeBtn,
                        {
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primaryLight : 'transparent',
                        },
                      ]}
                      onPress={() => store.setTheme(t)}
                    >
                      <Text style={[styles.themeBtnText, { color: active ? colors.primary : colors.text, fontWeight: active ? 'bold' : '600' }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            {/* 4. VERİ YÖNETİMİ */}
            <SectionHeader title="Veri Yönetimi ⚙️" />
            <Card style={styles.card}>
              <View style={styles.dataActions}>
                <Button title="Verilerimi Dışa Aktar (JSON)" variant="outline" onPress={handleExportData} />

                {showExport && (
                  <View style={styles.exportContainer}>
                    <Text style={[styles.exportDesc, { color: colors.textSecondary }]}>
                      Kopyalayıp saklamak için veri yedeğiniz:
                    </Text>
                    <TextInput
                      style={[styles.exportInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                      multiline
                      value={exportData}
                      editable={false}
                      selectTextOnFocus
                    />
                  </View>
                )}

                {wipeStep === 0 ? (
                  <Button
                    title="Tüm Verilerimi Sil"
                    variant="outline"
                    style={{ borderColor: '#EF4444' }}
                    textStyle={{ color: '#EF4444' }}
                    onPress={() => setWipeStep(1)}
                  />
                ) : wipeStep === 1 ? (
                  <View style={[styles.wipeConfirmBox, { borderColor: '#EF4444' }]}>
                    <Text style={[styles.wipeConfirmText, { color: '#EF4444' }]}>
                      UYARI: Tüm kayıtlarınız, hedefleriniz ve alışkanlıklarınız kalıcı olarak silinecektir. Emin misiniz?
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Button
                        title="Evet, Sil!"
                        style={{ flex: 1, backgroundColor: '#B91C1C' }}
                        onPress={handleResetConfirm}
                      />
                      <Button
                        title="Vazgeç"
                        variant="outline"
                        style={{ flex: 1 }}
                        onPress={() => setWipeStep(0)}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </Card>

            {/* 5. UYGULAMA BİLGİSİ */}
            <SectionHeader title="Uygulama Hakkında ℹ️" />
            <Card style={[styles.card, styles.aboutCard]}>
              <Text style={[styles.aboutTitle, { color: colors.text }]}>mySun ☀️</Text>
              <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>Sürüm 1.0.0</Text>
              <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>
                Günlük rutinlerinizi, su tüketiminizi, uykunuzu ve ruh halinizi takip etmek için hazırlanmış kişisel sağlıklı yaşam rehberiniz.
              </Text>
            </Card>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Linking.openURL('https://www.linkedin.com/in/srdrcll/').catch((err) => {
              if (__DEV__) console.error('Failed to open link:', err);
            });
          }}
          style={styles.signatureContainer}
        >
          <Text style={[styles.signatureText, { color: colors.textSecondary }]}>
            created by <Text style={styles.signatureLink}>srdrcll</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 80,
  },
  card: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
    height: 44,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.typography.sizes.bodySm,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionBtn: {
    marginTop: theme.spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  toggleBtn: {
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  reminderSubConfig: {
    marginTop: theme.spacing.sm,
    gap: 4,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  infoBoxText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  themeBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnText: {
    fontSize: theme.typography.sizes.bodySm,
  },
  dataActions: {
    gap: 12,
  },
  exportContainer: {
    marginTop: theme.spacing.xs,
  },
  exportDesc: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    marginBottom: 6,
  },
  exportInput: {
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
    height: 120,
    padding: theme.spacing.sm,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlignVertical: 'top',
  },
  wipeConfirmBox: {
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  wipeConfirmText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  aboutTitle: {
    fontSize: theme.typography.sizes.titleSm,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  aboutVersion: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  aboutDesc: {
    fontSize: theme.typography.sizes.bodySm,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.md,
  },
  signatureContainer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  signatureText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    opacity: 0.6,
  },
  signatureLink: {
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    padding: theme.spacing.sm,
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  badgeTitle: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.bodySm,
    textAlign: 'center',
  },
  badgeDesc: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
    minHeight: 24,
    marginBottom: 4,
  },
  badgeStatusIndicator: {
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeStatusText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 8,
    textTransform: 'uppercase',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    height: 56,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 80,
  },
  logoText: {
    fontSize: theme.typography.sizes.bodySm,
    fontFamily: theme.typography.fontFamilyHeadingBold,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontFamily: theme.typography.fontFamilyHeadingBold,
    textAlign: 'center',
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  headerActionIcon: {
    fontSize: 16,
  },
  backBtn: {
    width: 80,
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: theme.typography.sizes.bodySm,
  },
  profileContainer: {
    gap: theme.spacing.md,
  },
  profileHeaderCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarLetter: {
    fontSize: 32,
    fontFamily: theme.typography.fontFamilyHeadingBold,
  },
  profileName: {
    fontSize: theme.typography.sizes.titleSm,
    fontFamily: theme.typography.fontFamilyHeadingBold,
  },
  profileBio: {
    fontSize: theme.typography.sizes.bodySm,
    fontFamily: theme.typography.fontFamily,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  targetPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  targetPillText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamilyBold,
  },
  periodStatsTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontFamily: theme.typography.fontFamilyHeadingBold,
    marginBottom: theme.spacing.sm,
  },
  statsList: {
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontFamily: theme.typography.fontFamily,
  },
  statsValue: {
    fontSize: theme.typography.sizes.bodySm,
    fontFamily: theme.typography.fontFamilyBold,
  },
  settingsContainer: {
    gap: theme.spacing.md,
  },
});
