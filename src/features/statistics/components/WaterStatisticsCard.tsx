import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { getWaterStatistics } from '../selectors/statisticsSelectors';
import { CustomBarChart } from './CustomBarChart';

interface WaterStatisticsCardProps {
  range: string[];
}

export const WaterStatisticsCard: React.FC<WaterStatisticsCardProps> = ({ range }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const waterEntries = useWellnessStore((state) => state.history);
  const waterTarget = useWellnessStore((state) => state.waterTarget);

  // Extract all water entries from daily history records
  const allEntries = React.useMemo(() => {
    const list: any[] = [];
    Object.keys(waterEntries).forEach((dateKey) => {
      const record = waterEntries[dateKey];
      if (record && record.waterEntries) {
        list.push(...record.waterEntries);
      }
    });
    return list;
  }, [waterEntries]);

  // Compute stats
  const stats = React.useMemo(() => {
    return getWaterStatistics(allEntries, range, waterTarget);
  }, [allEntries, range, waterTarget]);

  const hasData = stats.totalVolume > 0;

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>💧 Su Tüketimi</Text>

      {!hasData ? (
        <EmptyState
          title="Veri bulunamadı"
          description="Bu dönem için henüz su kaydı bulunmuyor."
        />
      ) : (
        <View style={styles.content}>
          
          {/* Metrics grid */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.primary }]}>
                {stats.dailyAverage.toLocaleString('tr-TR')} ml
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Günlük Ortalama
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.success }]}>
                {stats.targetMetDays} / {stats.totalDays} gün
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Hedefe Ulaşılan
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.text }]}>
                {(stats.totalVolume / 1000).toFixed(1)} L
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Toplam Tüketim
              </Text>
            </View>
          </View>

          {/* Chart preview */}
          <CustomBarChart data={stats.chartData} type="water" color={colors.primary} />
          
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
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
