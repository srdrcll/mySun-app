import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { WaterEntry } from '../../../types';

interface TodayWaterListProps {
  dateKey: string;
}

export const TodayWaterList: React.FC<TodayWaterListProps> = ({ dateKey }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const history = useWellnessStore((state) => state.history);
  const removeWaterEntry = useWellnessStore((state) => state.removeWaterEntry);

  const dayRecord = history[dateKey];
  const entries = dayRecord?.waterEntries || [];

  // Sort: newest timestamp first
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getFormattedTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    } catch {
      return '--:--';
    }
  };

  const handleDeletePress = (entry: WaterEntry) => {
    Alert.alert(
      'Kayıt Silinsin mi?',
      `${entry.amount} ml değerindeki su kaydını silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => removeWaterEntry(entry.id, dateKey),
        },
      ]
    );
  };

  if (sortedEntries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Bugün henüz su kaydı eklemedin.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sortedEntries.map((entry) => (
        <View
          key={entry.id}
          style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <View style={styles.leftCol}>
            <Text style={styles.glassEmoji}>💧</Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {getFormattedTime(entry.timestamp)}
            </Text>
          </View>
          
          <Text style={[styles.amountText, { color: colors.text }]}>
            {entry.amount} <Text style={styles.unit}>ml</Text>
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]}
            onPress={() => handleDeletePress(entry)}
            aria-label="Kaydı Sil"
          >
            <Text style={[styles.deleteBtnText, { color: colors.danger }]}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glassEmoji: {
    fontSize: 16,
  },
  timeText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  amountText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.bold,
  },
  unit: {
    fontSize: 11,
    fontWeight: 'normal',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: 'heavy',
  },
  emptyContainer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.typography.sizes.bodySm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
