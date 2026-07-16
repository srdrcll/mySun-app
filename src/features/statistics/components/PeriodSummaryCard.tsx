import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';

interface PeriodSummaryCardProps {
  waterLiters: number;
  completedHabitsCount: number;
  moodCount: number;
  sleepHours: number;
  days: number;
}

export const PeriodSummaryCard: React.FC<PeriodSummaryCardProps> = ({
  waterLiters,
  completedHabitsCount,
  moodCount,
  sleepHours,
  days,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  return (
    <Card style={[styles.card, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
      <Text style={[styles.cardTitle, { color: colors.primary }]}>📊 Son {days} Günlük Özet</Text>
      
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.icon}>💧</Text>
          <Text style={[styles.summaryVal, { color: colors.text }]}>{waterLiters} L</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Su Kaydı</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.icon}>🌱</Text>
          <Text style={[styles.summaryVal, { color: colors.text }]}>{completedHabitsCount}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Alışkanlık</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.icon}>😊</Text>
          <Text style={[styles.summaryVal, { color: colors.text }]}>{moodCount}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Ruh Hali</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.icon}>😴</Text>
          <Text style={[styles.summaryVal, { color: colors.text }]}>{sleepHours} sa</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Kayıtlı Uyku</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
