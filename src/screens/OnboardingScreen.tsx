import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { ProgressBar } from '../components/ProgressBar';

export const OnboardingScreen: React.FC = () => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const completeOnboarding = useWellnessStore((state) => state.completeOnboarding);
  const colors = theme[currentTheme].colors;

  const [step, setStep] = useState(0);
  const totalSteps = 6;

  // Onboarding fields state
  const [name, setName] = useState('');
  const [waterTarget, setWaterTarget] = useState(2000);
  
  // Custom Time Picker state (Hours/Minutes)
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(30);
  const [sleepHour, setSleepHour] = useState(23);
  const [sleepMinute, setSleepMinute] = useState(0);
  
  const [notifications, setNotifications] = useState(true);

  // Time adjustment helper
  const adjustTime = (
    type: 'wake' | 'sleep',
    unit: 'hour' | 'minute',
    amount: number
  ) => {
    if (type === 'wake') {
      if (unit === 'hour') {
        setWakeHour((prev) => (prev + amount + 24) % 24);
      } else {
        setWakeMinute((prev) => (prev + amount + 60) % 60);
      }
    } else {
      if (unit === 'hour') {
        setSleepHour((prev) => (prev + amount + 24) % 24);
      } else {
        setSleepMinute((prev) => (prev + amount + 60) % 60);
      }
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Finish onboarding
      const formattedWakeTime = `${String(wakeHour).padStart(2, '0')}:${String(wakeMinute).padStart(2, '0')}`;
      const formattedSleepTime = `${String(sleepHour).padStart(2, '0')}:${String(sleepMinute).padStart(2, '0')}`;
      
      completeOnboarding(
        name.trim() || 'Kullanıcı',
        waterTarget,
        formattedWakeTime,
        formattedSleepTime,
        notifications
      );
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const isNextDisabled = () => {
    if (step === 1 && !name.trim()) return true;
    if (step === 2 && (isNaN(waterTarget) || waterTarget < 500)) return true;
    return false;
  };

  const formatTimeDisplay = (h: number, m: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Progress Bar (Only visible after Step 0) */}
        {step > 0 && (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={step / (totalSteps - 1)}
              color={colors.primary}
              height={6}
            />
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Adım {step} / {totalSteps - 1}
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* STEP 0: WELCOME */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.welcomeEmoji}>☀️</Text>
              <Text style={[styles.title, { color: colors.text }]}>
                mySun'a Hoş Geldin
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Birlikte daha sağlıklı, dengeli ve zinde bir yaşam rutini oluşturmaya hazır mısın? Günlük su, uyku, ruh hali ve alışkanlıklarını takip etmene yardımcı olacağız.
              </Text>
              <Card variant="flat" style={styles.disclaimerCard}>
                <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                  ⚠️ Uygulama tıbbi tavsiye vermez ve sağlık teşhisi koymaz. Sağlığınızla ilgili ciddi endişeleriniz için hekiminize danışın.
                </Text>
              </Card>
            </View>
          )}

          {/* STEP 1: NAME */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepEmoji}>🌸</Text>
              <Text style={[styles.title, { color: colors.text }]}>
                Seni Nasıl Çağıralım?
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Uygulama içi bildirimleri ve motivasyon mesajlarını senin için kişiselleştirebilmemiz için adını paylaşır mısın?
              </Text>
              <Input
                label="Adınız"
                placeholder="Örn: Elif, Ahmet..."
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={20}
              />
            </View>
          )}

          {/* STEP 2: WATER TARGET */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepEmoji}>💧</Text>
              <Text style={[styles.title, { color: colors.text }]}>
                Günlük Su Hedefin
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Vücudunun hidrasyonunu korumak için günde ne kadar su içmek istersin? (Varsayılan: 2000 ml)
              </Text>
              
              <Input
                label="Hedef Su Miktarı (ml)"
                placeholder="Örn: 2000"
                keyboardType="numeric"
                value={waterTarget.toString()}
                onChangeText={(val) => setWaterTarget(parseInt(val) || 0)}
              />

              <View style={styles.presetRow}>
                {[1500, 2000, 2500].map((preset) => (
                  <Button
                    key={preset}
                    title={`${preset} ml`}
                    variant={waterTarget === preset ? 'primary' : 'outline'}
                    size="sm"
                    style={styles.presetBtn}
                    onPress={() => setWaterTarget(preset)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* STEP 3: WAKE-UP TIME */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepEmoji}>☀️</Text>
              <Text style={[styles.title, { color: colors.text }]}>
                Güne Ne Zaman Başlarsın?
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Sana sabah uyanma vaktinde güzel bir motivasyon mesajı ve güne başlama uyarısı göndereceğiz.
              </Text>

              <Card variant="flat" style={styles.timePickerCard}>
                <Text style={[styles.timeDisplay, { color: colors.text }]}>
                  {formatTimeDisplay(wakeHour, wakeMinute)}
                </Text>
                
                <View style={styles.adjustControlsRow}>
                  {/* Hours Adjustment */}
                  <View style={styles.adjustGroup}>
                    <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Saat</Text>
                    <View style={styles.plusMinusRow}>
                      <Button title="-" size="sm" variant="outline" style={styles.adjustBtn} onPress={() => adjustTime('wake', 'hour', -1)} />
                      <Button title="+" size="sm" variant="outline" style={styles.adjustBtn} onPress={() => adjustTime('wake', 'hour', 1)} />
                    </View>
                  </View>
                  
                  {/* Minutes Adjustment */}
                  <View style={styles.adjustGroup}>
                    <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Dakika</Text>
                    <View style={styles.plusMinusRow}>
                      <Button title="-" size="sm" variant="outline" style={styles.adjustBtn} onPress={() => adjustTime('wake', 'minute', -5)} />
                      <Button title="+" size="sm" variant="outline" style={styles.adjustBtn} onPress={() => adjustTime('wake', 'minute', 5)} />
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* STEP 4: BEDTIME */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepEmoji}>🌙</Text>
              <Text style={[styles.title, { color: colors.text }]}>
                Yatış Saatin
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Uykudan önce ekranlardan uzaklaşmanı hatırlatmamız ve uyku takibini başlatmamız için ortalama yatış saatini seç.
              </Text>

              <Card variant="flat" style={styles.timePickerCard}>
                <Text style={[styles.timeDisplay, { color: colors.text }]}>
                  {formatTimeDisplay(sleepHour, sleepMinute)}
                </Text>
                
                <View style={styles.adjustControlsRow}>
                  {/* Hours Adjustment */}
                  <View style={styles.adjustGroup}>
                    <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Saat</Text>
                    <View style={styles.plusMinusRow}>
                      <Button title="-" size="sm" variant="outline" style={styles.adjustBtn} onPress={() => adjustTime('sleep', 'hour', -1)} />
                      <Button title="+" size="sm" variant="outline" style={styles.adjustBtn} onPress={() => adjustTime('sleep', 'hour', 1)} />
                    </View>
                  </View>
                  
                  {/* Minutes Adjustment */}
                  <View style={styles.adjustGroup}>
                    <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Dakika</Text>
                    <View style={styles.plusMinusRow}>
                      <Button title="-" size="sm" variant="outline" style={styles.adjustBtn} onPress={() => adjustTime('sleep', 'minute', -5)} />
                      <Button title="+" size="sm" variant="outline" style={styles.adjustBtn} onPress={() => adjustTime('sleep', 'minute', 5)} />
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* STEP 5: NOTIFICATIONS */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepEmoji}>🔔</Text>
              <Text style={[styles.title, { color: colors.text }]}>
                Hatırlatıcı Tercihi
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Hedeflerine ulaşman için gün içinde sana sessiz ve zarif hatırlatıcı bildirimler gönderelim mi?
              </Text>
              
              <Card style={styles.toggleCard}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextCol}>
                    <Text style={[styles.toggleTitle, { color: colors.text }]}>Hatırlatıcıları Etkinleştir</Text>
                    <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>Su içme, uyku vakti ve günlük esneme uyarıları.</Text>
                  </View>
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation Buttons */}
        <View style={styles.bottomNav}>
          {step > 0 ? (
            <Button
              title="Geri"
              variant="outline"
              style={styles.navBtn}
              onPress={handleBack}
            />
          ) : (
            <View style={styles.navBtnPlaceholder} />
          )}
          
          <Button
            title={step === totalSteps - 1 ? 'Uygulamaya Başla' : 'Sonraki'}
            disabled={isNextDisabled()}
            style={styles.navBtn}
            onPress={handleNext}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    alignItems: 'center',
  },
  stepText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
    marginTop: theme.spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  stepContent: {
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 72,
    marginBottom: theme.spacing.md,
  },
  stepEmoji: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.header,
    fontWeight: theme.typography.weights.heavy,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  disclaimerCard: {
    marginTop: theme.spacing.md,
  },
  disclaimerText: {
    fontSize: theme.typography.sizes.bodySm,
    lineHeight: 18,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  presetBtn: {
    flex: 1,
  },
  timePickerCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  timeDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  adjustControlsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  adjustGroup: {
    alignItems: 'center',
  },
  adjustLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  plusMinusRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  adjustBtn: {
    width: 44,
    minHeight: 44,
  },
  toggleCard: {
    width: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  toggleTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: theme.typography.sizes.bodySm,
    lineHeight: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  navBtn: {
    flex: 1,
  },
  navBtnPlaceholder: {
    flex: 1,
  },
});
