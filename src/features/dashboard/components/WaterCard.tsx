import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { ProgressBar } from '../../../components/ProgressBar';

interface WaterCardProps {
  onPress: () => void;
  onAddCustomWater: () => void;
}

export const WaterCard: React.FC<WaterCardProps> = ({ onPress, onAddCustomWater }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const waterTarget = useWellnessStore((state) => state.waterTarget);
  const history = useWellnessStore((state) => state.history);
  const addWaterEntry = useWellnessStore((state) => state.addWaterEntry);

  const getLocalDateString = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayKey = getLocalDateString();
  const todayRecord = history[todayKey] || { water: 0, waterEntries: [] };
  
  // Re-calculate sum from entries if available, otherwise fallback to stored numeric total
  const currentWater = todayRecord.waterEntries
    ? todayRecord.waterEntries.reduce((sum, e) => sum + e.amount, 0)
    : todayRecord.water || 0;

  const percentage = Math.min(100, Math.round((currentWater / waterTarget) * 100));
  const isTargetAchieved = currentWater >= waterTarget;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>💧 Su Takibi</Text>
        <Text style={[styles.percentage, { color: colors.primary }]}>%{percentage}</Text>
      </View>

      <View style={styles.dataRow}>
        <Text style={[styles.valuesText, { color: colors.text }]}>
          {currentWater} <Text style={[styles.targetUnitText, { color: colors.textSecondary }]}>/ {waterTarget} ml</Text>
        </Text>
        {isTargetAchieved && (
          <Text style={[styles.badgeText, { color: colors.success }]}>
            Hedef tamamlandı 🎉
          </Text>
        )}
      </View>

      <ProgressBar
        progress={currentWater / waterTarget}
        color={colors.info}
        height={8}
        style={styles.progressBar}
      />

      <View style={styles.quickAddRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.quickAddBtn, { backgroundColor: colors.infoLight }]}
          onPress={(e) => {
            e.stopPropagation();
            addWaterEntry(250);
          }}
        >
          <Text style={[styles.quickAddText, { color: colors.info }]}>+250 ml</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.quickAddBtn, { backgroundColor: colors.infoLight }]}
          onPress={(e) => {
            e.stopPropagation();
            addWaterEntry(500);
          }}
        >
          <Text style={[styles.quickAddText, { color: colors.info }]}>+500 ml</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.quickAddBtn, { backgroundColor: colors.infoLight }]}
          onPress={(e) => {
            e.stopPropagation();
            onAddCustomWater();
          }}
        >
          <Text style={[styles.quickAddText, { color: colors.info }]}>+ Özel</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.body,
  },
  percentage: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: theme.typography.sizes.bodySm,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  valuesText: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.header,
  },
  targetUnitText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.bodySm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBar: {
    marginBottom: theme.spacing.sm,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  quickAddBtn: {
    flex: 1,
    height: 38,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: theme.typography.sizes.bodySm,
  },
});
