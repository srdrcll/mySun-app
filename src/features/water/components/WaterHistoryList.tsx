import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { ProgressBar } from '../../../components/ProgressBar';
import { getLocalDateString, getFormattedDisplayDate } from '../../../utils/date';

export const WaterHistoryList: React.FC = () => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const history = useWellnessStore((state) => state.history);
  const waterTarget = useWellnessStore((state) => state.waterTarget);

  // Generate last 7 days list (today first, or chronological starting 6 days ago? Let's show chronological starting 6 days ago up to today, or descending today down to 6 days ago. Descending "today" down to "6 days ago" is extremely readable!).
  const daysList: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    daysList.push(getLocalDateString(d));
  }

  const getDayLabel = (dateStr: string, index: number): string => {
    if (index === 0) return 'Bugün';
    if (index === 1) return 'Dün';
    return getFormattedDisplayDate(dateStr);
  };

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>📊 Son 7 Günlük Geçmiş</Text>
      
      <View style={styles.list}>
        {daysList.map((dateKey, index) => {
          const dayRecord = history[dateKey];
          
          // Re-calculate sum from entries if available, otherwise fallback to stored numeric total
          const totalDrank = dayRecord
            ? dayRecord.waterEntries
              ? dayRecord.waterEntries.reduce((sum, e) => sum + e.amount, 0)
              : dayRecord.water || 0
            : 0;

          const progress = totalDrank / waterTarget;
          const percentage = Math.min(100, Math.round(progress * 100));

          return (
            <View key={dateKey} style={styles.historyRow}>
              <View style={styles.rowInfo}>
                <Text style={[styles.dayLabel, { color: colors.text }]}>
                  {getDayLabel(dateKey, index)}
                </Text>
                <Text style={[styles.amounts, { color: colors.textSecondary }]}>
                  {totalDrank} / {waterTarget} ml (%{percentage})
                </Text>
              </View>
              
              <ProgressBar
                progress={progress}
                color={colors.info}
                height={6}
              />
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  historyRow: {
    gap: 6,
  },
  rowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  dayLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  amounts: {
    fontSize: 11,
    fontWeight: '500',
  },
});
