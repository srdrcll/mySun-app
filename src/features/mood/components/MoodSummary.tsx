import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { calculateMoodFrequencies, MOOD_LIST } from '../utils/moodHelpers';

export const MoodSummary: React.FC = () => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const entries = useWellnessStore((state) => state.moodEntries);
  
  // Calculate frequencies over last 7 days
  const frequencies = calculateMoodFrequencies(entries, 7);

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>📊 Son 7 Günlük Ruh Hali Dağılımı</Text>
      
      <View style={styles.list}>
        {MOOD_LIST.map((m) => {
          const count = frequencies[m.mood] || 0;
          
          // Let's draw a tiny horizontal visual bar showing the count
          const maxDays = 7;
          const barWidthPercent = `${Math.max(4, Math.min(100, (count / maxDays) * 100))}%`;

          return (
            <View key={m.mood} style={styles.row}>
              {/* Emoji and Label */}
              <View style={styles.labelCol}>
                <Text style={styles.emoji}>{m.emoji}</Text>
                <Text style={[styles.labelText, { color: colors.text }]}>{m.label}</Text>
              </View>

              {/* Graphical Bar */}
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: barWidthPercent as any,
                      backgroundColor: m.color,
                    },
                  ]}
                />
              </View>

              {/* Count Indicator */}
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {count} gün
              </Text>
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
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 75,
  },
  emoji: {
    fontSize: 16,
  },
  labelText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  countText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
});
