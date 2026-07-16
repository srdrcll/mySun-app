import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { CircularProgress } from '../../../components/CircularProgress';
import { getLocalDateString } from '../../../utils/date';

export const DailySummarySection: React.FC = () => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  // Pulling state
  const waterTarget = useWellnessStore((state) => state.waterTarget);
  const sleepTarget = useWellnessStore((state) => state.sleepTarget);
  const habits = useWellnessStore((state) => state.habits);
  const completions = useWellnessStore((state) => state.habitCompletions);
  const history = useWellnessStore((state) => state.history);

  const todayKey = getLocalDateString();
  const todayDate = new Date();
  const todayDayOfWeek = todayDate.getDay();

  const todayRecord = history[todayKey] || {
    sleep: 0,
    sleepQuality: 2,
    mood: 0,
    moodNote: '',
  };

  // Re-calculate water from entries
  const currentWater = todayRecord.waterEntries
    ? todayRecord.waterEntries.reduce((sum, e) => sum + e.amount, 0)
    : (todayRecord as any).water || 0;

  // Get active planned habits for today
  const activeHabits = habits.filter((h) => h.isActive);
  const todayPlannedHabits = activeHabits.filter((h) => h.repeatDays.includes(todayDayOfWeek));

  const completedIds = new Set(
    completions.filter((c) => c.dateKey === todayKey).map((c) => c.habitId)
  );

  const completedHabitsCount = todayPlannedHabits.filter((h) => completedIds.has(h.id)).length;
  const plannedHabitsCount = todayPlannedHabits.length;

  // Weighted progress calculation
  const calculateProgress = () => {
    const waterVal = typeof currentWater === 'number' && !isNaN(currentWater) ? currentWater : 0;
    const sleepVal = todayRecord && typeof todayRecord.sleep === 'number' && !isNaN(todayRecord.sleep) ? todayRecord.sleep : 0;
    const moodVal = todayRecord && typeof todayRecord.mood === 'number' && !isNaN(todayRecord.mood) ? todayRecord.mood : 0;

    const waterScore = Math.min(1, waterVal / waterTarget);
    const sleepScore = Math.min(1, sleepVal / sleepTarget);
    const moodScore = moodVal > 0 ? 1 : 0;
    
    let habitScore = 1;
    if (plannedHabitsCount > 0) {
      habitScore = completedHabitsCount / plannedHabitsCount;
    }

    return (waterScore * 0.25) + (sleepScore * 0.25) + (habitScore * 0.3) + (moodScore * 0.2);
  };

  const totalProgress = calculateProgress();
  const percentage = Math.round(totalProgress * 100);

  return (
    <Card variant="highlight" style={styles.card}>
      <View style={styles.layout}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Bugünün Özeti</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Kendinize iyi bakma yolculuğunda bugün hedeflerinizin %{percentage}'ini tamamladınız.
          </Text>
          <View style={styles.statsOverviewRow}>
            <View style={styles.statItem}>
              <View style={[styles.bulletDot, { backgroundColor: colors.info }]} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                Su: {currentWater} ml
              </Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                Alışkanlıklar: {completedHabitsCount}/{plannedHabitsCount}
              </Text>
            </View>
          </View>
        </View>
        
        <CircularProgress
          progress={totalProgress}
          size={84}
          strokeWidth={8}
          color={colors.primary}
        >
          <Text style={[styles.percentageText, { color: colors.text }]}>
            {percentage}%
          </Text>
        </CircularProgress>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.titleSm,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.bodySm,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  statsOverviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    fontWeight: '600',
  },
  percentageText: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.body,
  },
});
