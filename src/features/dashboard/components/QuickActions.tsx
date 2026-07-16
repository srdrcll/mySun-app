import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';

interface QuickActionsProps {
  onAddWater: () => void;
  onAddMood: () => void;
  onHabitsPress: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddWater,
  onAddMood,
  onHabitsPress,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const actions = [
    {
      label: '💧 Su Ekle',
      onPress: onAddWater,
      bg: colors.infoLight,
      color: colors.info,
    },
    {
      label: '😊 Mood Ekle',
      onPress: onAddMood,
      bg: colors.primaryLight,
      color: colors.primary,
    },
    {
      label: '✓ Alışkanlık',
      onPress: onHabitsPress,
      bg: colors.successLight,
      color: colors.success,
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((act, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={0.7}
          style={[styles.actionBtn, { backgroundColor: act.bg }]}
          onPress={act.onPress}
        >
          <Text style={[styles.actionLabel, { color: act.color }]}>
            {act.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.bold,
  },
});
