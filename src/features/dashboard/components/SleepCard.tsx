import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { formatSleepDurationFull } from '../../sleep/utils/sleepHelpers';

interface SleepCardProps {
  onPress: () => void;
}

export const SleepCard: React.FC<SleepCardProps> = ({ onPress }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const sleepEntries = useWellnessStore((state) => state.sleepEntries);

  // Get the latest completed sleep entry based on wakeTime timestamp
  const getLatestSleepEntry = () => {
    if (sleepEntries.length === 0) return undefined;
    const sorted = [...sleepEntries].sort(
      (a, b) => new Date(b.wakeTime).getTime() - new Date(a.wakeTime).getTime()
    );
    return sorted[0];
  };

  const latest = getLatestSleepEntry();

  const getFormattedTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '--:--';
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Text style={[styles.title, { color: colors.text }]}>😴 Uyku Takibi</Text>

      {!latest ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Henüz uyku kaydı yok.
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Geceleri ne kadar uyuduğunuzu takip edin.
          </Text>
        </View>
      ) : (
        <View style={styles.sleepContent}>
          <Text style={[styles.durationText, { color: colors.text }]}>
            {formatSleepDurationFull(latest.durationMinutes)}
          </Text>
          <Text style={[styles.intervalText, { color: colors.textSecondary }]}>
            {getFormattedTime(latest.sleepTime)} → {getFormattedTime(latest.wakeTime)}
          </Text>
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
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.body,
    marginBottom: theme.spacing.sm,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 2,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.caption,
    textAlign: 'center',
  },
  sleepContent: {
    paddingVertical: theme.spacing.xs,
  },
  durationText: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.header - 2,
    marginBottom: 4,
  },
  intervalText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
});
