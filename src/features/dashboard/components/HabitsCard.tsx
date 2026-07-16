import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { ProgressBar } from '../../../components/ProgressBar';
import { getLocalDateString } from '../../../utils/date';

interface HabitsCardProps {
  onPress: () => void;
}

export const HabitsCard: React.FC<HabitsCardProps> = ({ onPress }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const habits = useWellnessStore((state) => state.habits);
  const completions = useWellnessStore((state) => state.habitCompletions);
  const toggleCompletion = useWellnessStore((state) => state.toggleHabitCompletion);

  const todayKey = getLocalDateString();
  const todayDate = new Date();
  const todayDayOfWeek = todayDate.getDay();

  // Active habits list
  const activeHabits = habits.filter((h) => h.isActive);

  // Today's planned habits
  const todayPlannedHabits = activeHabits.filter((h) => h.repeatDays.includes(todayDayOfWeek));

  // Today's completed habit IDs
  const completedIds = new Set(
    completions.filter((c) => c.dateKey === todayKey).map((c) => c.habitId)
  );

  const completedCount = todayPlannedHabits.filter((h) => completedIds.has(h.id)).length;
  const totalCount = todayPlannedHabits.length;

  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const percentage = Math.round(progress * 100);

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>🌱 Alışkanlıklar</Text>
        {totalCount > 0 && (
          <Text style={[styles.percentage, { color: colors.primary }]}>%{percentage}</Text>
        )}
      </View>

      {totalCount === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Bugün için planlanmış aktif alışkanlık yok.
          </Text>
        </View>
      ) : (
        <View style={styles.dataRow}>
          <Text style={[styles.valuesText, { color: colors.text }]}>
            {completedCount} <Text style={[styles.totalUnitText, { color: colors.textSecondary }]}>/ {totalCount} tamamlandı</Text>
          </Text>
        </View>
      )}

      {totalCount > 0 && (
        <ProgressBar
          progress={progress}
          color={colors.primary}
          height={8}
          style={styles.progressBar}
        />
      )}

      {/* Habit Checklist Grid */}
      {todayPlannedHabits.length > 0 && (
        <View style={styles.checklistContainer}>
          {todayPlannedHabits.map((habit) => {
            const isCompleted = completedIds.has(habit.id);
            return (
              <TouchableOpacity
                key={habit.id}
                activeOpacity={0.7}
                style={[
                  styles.habitItemRow,
                  {
                    borderColor: colors.border,
                    backgroundColor: isCompleted ? colors.successLight : colors.backgroundSecondary,
                  },
                ]}
                onPress={(e) => {
                  e.stopPropagation(); // Avoid opening screen when toggling checklist
                  toggleCompletion(habit.id, todayKey);
                }}
              >
                <View style={styles.habitLeft}>
                  <Text style={styles.habitEmojiText}>{habit.emoji}</Text>
                  <Text
                    style={[
                      styles.habitInfoText,
                      {
                        color: colors.text,
                        textDecorationLine: isCompleted ? 'line-through' : 'none',
                        opacity: isCompleted ? 0.6 : 1,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {habit.name}
                  </Text>
                </View>

                <View
                  style={[
                    styles.checkboxCircle,
                    {
                      borderColor: isCompleted ? colors.success : colors.textSecondary,
                      backgroundColor: isCompleted ? colors.success : 'transparent',
                    },
                  ]}
                >
                  {isCompleted && <Text style={styles.checkMarkText}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.seeAllContainer}
      >
        <Text style={[styles.seeAllText, { color: colors.primary }]}>Tümünü Gör</Text>
      </TouchableOpacity>
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
    marginBottom: theme.spacing.sm,
  },
  valuesText: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.header - 2,
  },
  totalUnitText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.bodySm,
  },
  progressBar: {
    marginBottom: theme.spacing.sm,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.bodySm,
    fontStyle: 'italic',
  },
  seeAllContainer: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginTop: theme.spacing.sm,
  },
  seeAllText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: theme.typography.sizes.bodySm,
  },
  checklistContainer: {
    marginTop: theme.spacing.xs,
    gap: 8,
  },
  habitItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  habitEmojiText: {
    fontSize: 16,
  },
  habitInfoText: {
    fontFamily: theme.typography.fontFamilyMedium,
    fontSize: theme.typography.sizes.bodySm,
    flex: 1,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 14,
  },
});
