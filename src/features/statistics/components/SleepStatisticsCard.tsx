import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { getSleepStatistics } from '../selectors/statisticsSelectors';
import { CustomBarChart } from './CustomBarChart';
import { formatSleepDuration } from '../../sleep/utils/sleepHelpers';

interface SleepStatisticsCardProps {
  range: string[];
}

export const SleepStatisticsCard: React.FC<SleepStatisticsCardProps> = ({ range }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const sleepEntries = useWellnessStore((state) => state.sleepEntries);

  // Compute stats
  const stats = React.useMemo(() => {
    return getSleepStatistics(sleepEntries, range);
  }, [sleepEntries, range]);

  const hasData = stats.totalMinutes > 0;

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>😴 Uyku</Text>

      {!hasData ? (
        <EmptyState
          title="Veri bulunamadı"
          description="Bu dönem için uyku kaydı bulunmuyor."
        />
      ) : (
        <View style={styles.content}>
          
          {/* Metrics grid */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.primary }]}>
                {formatSleepDuration(stats.averageMinutes)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Günlük Ortalama
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.success }]}>
                {formatSleepDuration(stats.totalMinutes)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Toplam Süre
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.text }]}>
                {formatSleepDuration(stats.longestLogMinutes)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                En Uzun Uyku
              </Text>
            </View>
          </View>

          {/* Chart preview */}
          <CustomBarChart data={stats.chartData} type="sleep" color={colors.primary} />
          
        </View>
      )}
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
  content: {
    width: '100%',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
