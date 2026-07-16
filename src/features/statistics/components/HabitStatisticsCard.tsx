import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { getHabitStatistics } from '../selectors/statisticsSelectors';
import { CustomBarChart } from './CustomBarChart';

interface HabitStatisticsCardProps {
  range: string[];
}

export const HabitStatisticsCard: React.FC<HabitStatisticsCardProps> = ({ range }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const habits = useWellnessStore((state) => state.habits);
  const completions = useWellnessStore((state) => state.habitCompletions);

  // Compute stats
  const stats = React.useMemo(() => {
    return getHabitStatistics(habits, completions, range);
  }, [habits, completions, range]);

  const hasPlanned = stats.totalPlanned > 0;

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>🌱 Alışkanlıklar</Text>

      {!hasPlanned ? (
        <EmptyState
          title="Veri bulunamadı"
          description="Bu dönem için planlanmış alışkanlık bulunmuyor."
        />
      ) : (
        <View style={styles.content}>
          
          {/* Metrics grid */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.primary }]}>
                %{stats.completionRate}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Tamamlama Oranı
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.success }]}>
                {stats.totalCompleted} / {stats.totalPlanned}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Tamamlanan
              </Text>
            </View>
          </View>

          {/* Most Regular Habits list */}
          {stats.mostRegular.length > 0 && (
            <View style={styles.regularContainer}>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>⭐ En Düzenli Rutinler</Text>
              <View style={styles.regularList}>
                {stats.mostRegular.map((item, idx) => (
                  <View key={idx} style={[styles.regularRow, { borderColor: colors.border }]}>
                    <Text style={[styles.regularText, { color: colors.text }]}>
                      {item.emoji} {item.name}
                    </Text>
                    <Text style={[styles.regularRate, { color: colors.success }]}>
                      %{item.rate}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Chart preview */}
          <CustomBarChart data={stats.chartData} type="habit" color={colors.primary} />
          
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
  regularContainer: {
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  regularList: {
    gap: 6,
  },
  regularRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.sm,
  },
  regularText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  regularRate: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
});
