import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { getFormattedDisplayDate, getLocalDateString } from '../utils/date';
import { getDaySummary } from '../features/calendar/selectors/calendarSelectors';
import { getDailyMessage, replacePlaceholders } from '../features/specialMessages/utils/messageHelpers';

interface DayDetailScreenProps {
  dateKey: string;
  onBack: () => void;
}

export const DayDetailScreen: React.FC<DayDetailScreenProps> = ({ dateKey, onBack }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const username = useWellnessStore((state) => state.username);
  const store = useWellnessStore();

  const todayKey = getLocalDateString();
  const isFuture = dateKey > todayKey;

  // Retrieve day summary from central selectors
  const summary = useMemo(() => {
    return getDaySummary(dateKey, store);
  }, [dateKey, store]);

  // Retrieve daily message
  const dailyMessage = useMemo(() => {
    return getDailyMessage(dateKey);
  }, [dateKey]);

  // Format minutes to "X sa Y dk"
  const formatDuration = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) {
      return m > 0 ? `${h} sa ${m} dk` : `${h} sa`;
    }
    return `${m} dk`;
  };

  // Convert ISO timestamp to "HH:MM"
  const formatTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '00:00';
    }
  };

  // Resolve mood emojis
  const getMoodEmoji = (mood: string): string => {
    const emojis: Record<string, string> = {
      great: '😊',
      good: '🙂',
      neutral: '😐',
      bad: '🙁',
      difficult: '😣',
    };
    return emojis[mood] || '😐';
  };

  const getMoodText = (mood: string): string => {
    const texts: Record<string, string> = {
      great: 'Harika',
      good: 'İyi',
      neutral: 'Normal',
      bad: 'Kötü',
      difficult: 'Zor',
    };
    return texts[mood] || 'Belirtilmemiş';
  };

  // Quick summary stats row values
  const waterText = `${summary.waterAmount} ml`;
  const habitsText = summary.habitsPlanned > 0
    ? `${summary.habitsCompleted}/${summary.habitsPlanned}`
    : '—';
  const moodText = summary.latestMood
    ? `${getMoodEmoji(summary.latestMood.mood)} ${getMoodText(summary.latestMood.mood)}`
    : '—';
  const sleepText = summary.sleepMinutes > 0
    ? formatDuration(summary.sleepMinutes)
    : '—';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Text style={[styles.backBtnText, { color: colors.text }]}>← Geri</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {getFormattedDisplayDate(dateKey)}
        </Text>
        
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Visual Quick Summary Grid */}
        <Card style={styles.quickSummaryCard}>
          <View style={styles.quickSummaryRow}>
            <View style={styles.quickSummaryItem}>
              <Text style={styles.quickSummaryEmoji}>💧</Text>
              <Text style={[styles.quickSummaryValue, { color: colors.text }]}>{waterText}</Text>
              <Text style={[styles.quickSummaryLabel, { color: colors.textSecondary }]}>Su</Text>
            </View>
            <View style={styles.quickSummaryItem}>
              <Text style={styles.quickSummaryEmoji}>🌱</Text>
              <Text style={[styles.quickSummaryValue, { color: colors.text }]}>{habitsText}</Text>
              <Text style={[styles.quickSummaryLabel, { color: colors.textSecondary }]}>Rutinler</Text>
            </View>
            <View style={styles.quickSummaryItem}>
              <Text style={styles.quickSummaryEmoji}>🧠</Text>
              <Text style={[styles.quickSummaryValue, { color: colors.text }]}>{moodText}</Text>
              <Text style={[styles.quickSummaryLabel, { color: colors.textSecondary }]}>Ruh Hali</Text>
            </View>
            <View style={styles.quickSummaryItem}>
              <Text style={styles.quickSummaryEmoji}>😴</Text>
              <Text style={[styles.quickSummaryValue, { color: colors.text }]}>{sleepText}</Text>
              <Text style={[styles.quickSummaryLabel, { color: colors.textSecondary }]}>Uyku</Text>
            </View>
          </View>
        </Card>

        {isFuture ? (
          // Future empty state
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>⏳</Text>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>Bu tarih henüz gelmedi.</Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              Gelecek günlerinize ait wellness kayıtlarını zamanı geldiğinde kaydedebilirsiniz.
            </Text>
          </View>
        ) : (
          <>
            {/* 1. SU DETAYI */}
            <SectionHeader title="Su Tüketimi 💧" />
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Toplam: {summary.waterAmount} / {summary.waterTarget} ml
                </Text>
                {summary.waterAmount >= summary.waterTarget && (
                  <Text style={[styles.achievementBadge, { color: colors.info }]}>✓ HEDEF AŞILDI</Text>
                )}
              </View>
              
              {/* Progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.info,
                      width: `${Math.min(100, (summary.waterAmount / summary.waterTarget) * 100)}%`,
                    },
                  ]}
                />
              </View>

              {/* Water logs */}
              {summary.waterEntries.length > 0 ? (
                <View style={styles.logsList}>
                  {summary.waterEntries.map((e) => (
                    <View key={e.id} style={[styles.logRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                        {formatTime(e.timestamp)}
                      </Text>
                      <Text style={[styles.logAmount, { color: colors.text }]}>
                        +{e.amount} ml
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noRecordsText, { color: colors.textSecondary }]}>
                  Bu gün için su kaydı yok.
                </Text>
              )}
            </Card>

            {/* 2. ALIŞKANLIKLAR */}
            <SectionHeader title="Alışkanlıklar & Rutinler 🌱" />
            <Card style={styles.sectionCard}>
              {summary.habitsPlanned > 0 ? (
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: theme.spacing.sm }]}>
                    {summary.habitsCompleted} / {summary.habitsPlanned} tamamlandı
                  </Text>
                  
                  <View style={styles.habitsGrid}>
                    {summary.habitsList.map((h) => (
                      <View key={h.id} style={styles.habitRow}>
                        <Text style={[styles.habitStatusIcon, { color: h.completed ? colors.primary : colors.textSecondary }]}>
                          {h.completed ? '✓' : '○'}
                        </Text>
                        <Text style={styles.habitEmoji}>{h.emoji}</Text>
                        <Text
                          style={[
                            styles.habitName,
                            {
                              color: h.completed ? colors.text : colors.textSecondary,
                              textDecorationLine: h.completed ? 'line-through' : 'none',
                            },
                          ]}
                        >
                          {h.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={[styles.noRecordsText, { color: colors.textSecondary }]}>
                  Bu gün için planlanmış bir alışkanlık yok.
                </Text>
              )}
            </Card>

            {/* 3. RUH HALİ */}
            <SectionHeader title="Ruh Hali Geçmişi 🧠" />
            <Card style={styles.sectionCard}>
              {summary.moodEntries.length > 0 ? (
                <View style={styles.logsList}>
                  {summary.moodEntries.map((e) => (
                    <View key={e.id} style={[styles.moodLogRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.moodLogHeader}>
                        <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                          {formatTime(e.timestamp)}
                        </Text>
                        <Text style={[styles.moodValText, { color: colors.text }]}>
                          {getMoodEmoji(e.mood)} {getMoodText(e.mood)}
                        </Text>
                      </View>
                      {e.note ? (
                        <Text style={[styles.moodNoteText, { color: colors.textSecondary }]}>
                          "{e.note}"
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noRecordsText, { color: colors.textSecondary }]}>
                  Bu gün için ruh hali kaydı yok.
                </Text>
              )}
            </Card>

            {/* 4. UYKU */}
            <SectionHeader title="Uyku Detayı 😴" />
            <Card style={styles.sectionCard}>
              {summary.sleepEntries.length > 0 ? (
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: theme.spacing.sm }]}>
                    Toplam: {formatDuration(summary.sleepMinutes)}
                  </Text>
                  
                  <View style={styles.logsList}>
                    {summary.sleepEntries.map((e) => {
                      const duration = e.durationMinutes;
                      return (
                        <View key={e.id} style={[styles.sleepLogRow, { borderBottomColor: colors.border }]}>
                          <View style={styles.sleepLogHeader}>
                            <Text style={[styles.sleepLogTimes, { color: colors.text }]}>
                              {formatTime(e.sleepTime)} ➔ {formatTime(e.wakeTime)}
                            </Text>
                            <Text style={[styles.sleepLogDuration, { color: colors.primary }]}>
                              {formatDuration(duration)}
                            </Text>
                          </View>
                          {e.source === 'health' && (
                            <Text style={styles.healthSourceBadge}> Sağlık Uygulaması</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <Text style={[styles.noRecordsText, { color: colors.textSecondary }]}>
                  Bu gün için uyku kaydı yok.
                </Text>
              )}
            </Card>

            {/* 5. GÜNÜN MEKTUBU */}
            <SectionHeader title="O Günün Notu 💌" />
            <Card style={[styles.letterCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Text style={[styles.letterText, { color: colors.text }]}>
                "{replacePlaceholders(dailyMessage.content, username)}"
              </Text>
            </Card>
          </>
        )}
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
  },
  backBtnText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.titleSm,
    fontWeight: 'bold',
  },
  backBtnPlaceholder: {
    width: 60,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 60,
  },
  quickSummaryCard: {
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  quickSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickSummaryEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  quickSummaryValue: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  quickSummaryLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  sectionCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
  },
  achievementBadge: {
    fontSize: 9,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  logsList: {
    gap: 8,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logTime: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  logAmount: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  noRecordsText: {
    fontSize: theme.typography.sizes.bodySm,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  habitsGrid: {
    gap: 8,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  habitStatusIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 20,
  },
  habitEmoji: {
    fontSize: 16,
  },
  habitName: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  moodLogRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  moodLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  moodValText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  moodNoteText: {
    fontSize: theme.typography.sizes.caption,
    fontStyle: 'italic',
    paddingLeft: theme.spacing.xs,
  },
  sleepLogRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sleepLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sleepLogTimes: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  sleepLogDuration: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  healthSourceBadge: {
    fontSize: 8,
    color: '#EF4444',
    fontWeight: 'bold',
    marginTop: 2,
  },
  letterCard: {
    borderWidth: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
  },
  letterText: {
    fontSize: theme.typography.sizes.bodySm,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  letterAuthor: {
    fontSize: 11,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateEmoji: {
    fontSize: 44,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: theme.typography.sizes.bodySm,
    textAlign: 'center',
    lineHeight: 18,
  },
});
