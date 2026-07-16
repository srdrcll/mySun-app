import React, { useState, useMemo } from 'react';
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
import { getPastDaysList } from '../utils/date';

// Selectors
import {
  getWaterStatistics,
  getHabitStatistics,
  getMoodStatistics,
  getSleepStatistics,
  getPeriodSummary,
} from '../features/statistics/selectors/statisticsSelectors';

// Components
import { PeriodSummaryCard } from '../features/statistics/components/PeriodSummaryCard';
import { WaterStatisticsCard } from '../features/statistics/components/WaterStatisticsCard';
import { HabitStatisticsCard } from '../features/statistics/components/HabitStatisticsCard';
import { MoodStatisticsCard } from '../features/statistics/components/MoodStatisticsCard';
import { SleepStatisticsCard } from '../features/statistics/components/SleepStatisticsCard';
import { AppHeader } from '../components/AppHeader';

interface StatisticsScreenProps {
  onBack?: () => void;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ onBack }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  // Local state for selected period
  const [activePeriod, setActivePeriod] = useState<7 | 30 | 90>(7);

  // Store data hooks
  const history = useWellnessStore((state) => state.history);
  const waterTarget = useWellnessStore((state) => state.waterTarget);
  const habits = useWellnessStore((state) => state.habits);
  const completions = useWellnessStore((state) => state.habitCompletions);
  const moodEntries = useWellnessStore((state) => state.moodEntries);
  const sleepEntries = useWellnessStore((state) => state.sleepEntries);

  // Date range keys chronologically
  const range = useMemo(() => {
    return getPastDaysList(activePeriod);
  }, [activePeriod]);

  // Extract all water logs for calculations
  const allWaterEntries = useMemo(() => {
    const list: any[] = [];
    Object.keys(history).forEach((dateKey) => {
      const record = history[dateKey];
      if (record && record.waterEntries) {
        list.push(...record.waterEntries);
      }
    });
    return list;
  }, [history]);

  // Memoized statistics calculations
  const waterStats = useMemo(() => {
    return getWaterStatistics(allWaterEntries, range, waterTarget);
  }, [allWaterEntries, range, waterTarget]);

  const habitStats = useMemo(() => {
    return getHabitStatistics(habits, completions, range);
  }, [habits, completions, range]);

  const moodStats = useMemo(() => {
    return getMoodStatistics(moodEntries, range);
  }, [moodEntries, range]);

  const sleepStats = useMemo(() => {
    return getSleepStatistics(sleepEntries, range);
  }, [sleepEntries, range]);

  // Aggregated period summary
  const summary = useMemo(() => {
    return getPeriodSummary(waterStats, habitStats, moodStats, sleepStats);
  }, [waterStats, habitStats, moodStats, sleepStats]);

  const periods: (7 | 30 | 90)[] = [7, 30, 90];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader />

      {/* Date filter selector */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        {periods.map((p) => {
          const isSelected = activePeriod === p;
          return (
            <TouchableOpacity
              key={p}
              activeOpacity={0.7}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActivePeriod(p)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected ? 'bold' : '600',
                  },
                ]}
              >
                {p} Gün
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Aggregated Period Summary Card */}
        <PeriodSummaryCard
          waterLiters={summary.waterLiters}
          completedHabitsCount={summary.completedHabitsCount}
          moodCount={summary.moodCount}
          sleepHours={summary.sleepHours}
          days={activePeriod}
        />

        {/* 1. Water Stats Card */}
        <WaterStatisticsCard range={range} />

        {/* 2. Habit Stats Card */}
        <HabitStatisticsCard range={range} />

        {/* 3. Mood Stats Card */}
        <MoodStatisticsCard range={range} />

        {/* 4. Sleep Stats Card */}
        <SleepStatisticsCard range={range} />

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
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
  },
  filterBtnText: {
    fontSize: theme.typography.sizes.bodySm,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 80, // room for bottom nav if any
  },
});
