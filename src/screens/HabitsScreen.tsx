import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { Habit } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { getLocalDateString, getFormattedDisplayDate } from '../utils/date';
import { formatRepeatDays } from '../features/habits/utils/streak';

// Subcomponents
import { HabitCreateModal } from '../features/habits/components/HabitCreateModal';
import { HabitDetailModal } from '../features/habits/components/HabitDetailModal';

interface HabitsScreenProps {
  onBack: () => void;
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({ onBack }) => {
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

  // Completed date keys set
  const todayCompletedIds = new Set(
    completions.filter((c) => c.dateKey === todayKey).map((c) => c.habitId)
  );

  const completedCount = todayPlannedHabits.filter((h) => todayCompletedIds.has(h.id)).length;
  const plannedCount = todayPlannedHabits.length;
  
  const progress = plannedCount > 0 ? completedCount / plannedCount : 0;
  const percentage = Math.round(progress * 100);
  const isAllCompleted = plannedCount > 0 && completedCount === plannedCount;

  // Modals state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const [selectedHabit, setSelectedHabit] = useState<Habit | undefined>(undefined);
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);

  const handleOpenDetail = (habit: Habit) => {
    setSelectedHabit(habit);
    setDetailModalVisible(true);
  };

  const handleOpenEdit = () => {
    setHabitToEdit(selectedHabit);
    setCreateModalVisible(true);
  };

  const handleOpenNew = () => {
    setHabitToEdit(undefined);
    setCreateModalVisible(true);
  };

  // Generate last 7 days details (today down to 6 days ago)
  const getPast7DaysSummary = () => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      const dateKey = getLocalDateString(d);
      const dayOfWeek = d.getDay();
      
      // Calculate planned and completed for that specific historical day
      // (Note: we check repeatDays against current active state, which is the standard simple model)
      const dayPlanned = activeHabits.filter((h) => h.repeatDays.includes(dayOfWeek));
      const dayCompleted = completions.filter((c) => c.dateKey === dateKey);
      
      // Count how many of the day's planned habits are present in completed list
      const completedIds = new Set(dayCompleted.map((c) => c.habitId));
      const plannedCountVal = dayPlanned.length;
      const completedCountVal = dayPlanned.filter((h) => completedIds.has(h.id)).length;

      list.push({
        dateKey,
        label: i === 0 ? 'Bugün' : i === 1 ? 'Dün' : getFormattedDisplayDate(dateKey),
        planned: plannedCountVal,
        completed: completedCountVal,
      });
    }
    return list;
  };

  const past7Days = getPast7DaysSummary();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header Row */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Text style={[styles.backBtnText, { color: colors.text }]}>← Geri</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Alışkanlıklarım</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenNew}
          style={[styles.addIconBtn, { backgroundColor: colors.primaryLight }]}
        >
          <Text style={[styles.addIconText, { color: colors.primary }]}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Progress Card */}
        {plannedCount > 0 && (
          <Card style={styles.progressCard}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Bugünkü İlerlemen</Text>
            <View style={styles.progressDataRow}>
              <Text style={[styles.progressValues, { color: colors.text }]}>
                {completedCount} <Text style={{ fontSize: 13, fontWeight: 'normal', color: colors.textSecondary }}>/ {plannedCount} tamamlandı</Text>
              </Text>
              <Text style={[styles.progressPct, { color: colors.primary }]}>%{percentage}</Text>
            </View>

            <ProgressBar
              progress={progress}
              color={colors.primary}
              height={8}
              style={styles.progressBar}
            />

            {isAllCompleted && (
              <View style={[styles.completeBadge, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                <Text style={[styles.completeBadgeText, { color: colors.text }]}>
                  Bugünkü rutinlerin tamamlandı 🌱
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* 4. Bugünün Alışkanlıkları */}
        <SectionHeader title="Bugünkü Plan 🗓️" />

        {activeHabits.length === 0 ? (
          <EmptyState
            title="Henüz bir alışkanlığın yok."
            description="Küçük bir rutin oluşturarak başlayabilirsin."
            actionTitle="+ İlk Alışkanlığını Oluştur"
            onActionPress={handleOpenNew}
          />
        ) : todayPlannedHabits.length === 0 ? (
          <EmptyState
            title="Bugün için planlanmış bir alışkanlık yok."
            description="Diğer alışkanlıklarınızı düzenleyebilir veya yeni bir alışkanlık ekleyebilirsiniz."
          />
        ) : (
          <View style={styles.habitsList}>
            {todayPlannedHabits.map((habit) => {
              const isCompleted = todayCompletedIds.has(habit.id);
              return (
                <View
                  key={habit.id}
                  style={[
                    styles.habitRow,
                    {
                      borderColor: colors.border,
                      backgroundColor: isCompleted ? colors.successLight : colors.card,
                    },
                  ]}
                >
                  {/* Checkbox */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isCompleted ? colors.success : colors.textSecondary,
                        backgroundColor: isCompleted ? colors.success : 'transparent',
                      },
                    ]}
                    onPress={() => toggleCompletion(habit.id, todayKey)}
                  >
                    {isCompleted && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>

                  {/* Info Column (Tap details) */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.habitInfo}
                    onPress={() => handleOpenDetail(habit)}
                  >
                    <View style={styles.nameRow}>
                      <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                      <Text
                        style={[
                          styles.habitName,
                          {
                            color: colors.text,
                            textDecorationLine: isCompleted ? 'line-through' : 'none',
                            opacity: isCompleted ? 0.7 : 1,
                          },
                        ]}
                      >
                        {habit.name}
                      </Text>
                    </View>
                    <Text style={[styles.habitSchedule, { color: colors.textSecondary }]}>
                      {formatRepeatDays(habit.repeatDays)}
                    </Text>
                  </TouchableOpacity>

                  {/* Detail Arrow */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.arrowBtn}
                    onPress={() => handleOpenDetail(habit)}
                  >
                    <Text style={[styles.arrowText, { color: colors.textSecondary }]}>➔</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Tüm Alışkanlıklar Listesi (Diyelim ki plansız ama aktif olanları da yönetmek istiyor) */}
        {activeHabits.length > 0 && (
          <>
            <SectionHeader title="Tüm Alışkanlıklarım 📋" />
            <View style={styles.habitsList}>
              {activeHabits.map((habit) => {
                const isPlannedToday = habit.repeatDays.includes(todayDayOfWeek);
                return (
                  <TouchableOpacity
                    key={habit.id}
                    activeOpacity={0.7}
                    style={[styles.allHabitRow, { borderColor: colors.border, backgroundColor: colors.card }]}
                    onPress={() => handleOpenDetail(habit)}
                  >
                    <View style={styles.allHabitLeft}>
                      <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                      <View style={styles.allHabitInfo}>
                        <Text style={[styles.allHabitName, { color: colors.text }]}>{habit.name}</Text>
                        <Text style={[styles.habitSchedule, { color: colors.textSecondary }]}>
                          {formatRepeatDays(habit.repeatDays)} {isPlannedToday ? '• Bugün planlı' : ''}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.arrowText, { color: colors.textSecondary }]}>➔</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* 17. Geçmiş / Son 7 Gün */}
        <SectionHeader title="Son 7 Günlük İlerleme 📊" />
        <Card style={styles.historyCard}>
          <View style={styles.historyList}>
            {past7Days.map((day) => {
              const progressVal = day.planned > 0 ? day.completed / day.planned : 0;
              const pctVal = Math.round(progressVal * 100);
              return (
                <View key={day.dateKey} style={styles.historyRow}>
                  <View style={styles.historyRowInfo}>
                    <Text style={[styles.historyLabel, { color: colors.text }]}>{day.label}</Text>
                    <Text style={[styles.historyValues, { color: colors.textSecondary }]}>
                      {day.completed} / {day.planned} (%{pctVal})
                    </Text>
                  </View>
                  <ProgressBar
                    progress={progressVal}
                    color={colors.primary}
                    height={6}
                  />
                </View>
              );
            })}
          </View>
        </Card>

      </ScrollView>

      {/* CREATE / EDIT MODAL */}
      <HabitCreateModal
        visible={createModalVisible}
        onClose={() => {
          setCreateModalVisible(false);
          setHabitToEdit(undefined);
        }}
        habitToEdit={habitToEdit}
      />

      {/* DETAIL MODAL */}
      <HabitDetailModal
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedHabit(undefined);
        }}
        habit={selectedHabit}
        onEdit={handleOpenEdit}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
  },
  backBtnText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.titleSm,
    fontWeight: 'bold',
  },
  addIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconText: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 60,
  },
  progressCard: {
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  progressLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  progressValues: {
    fontSize: theme.typography.sizes.header,
    fontWeight: 'bold',
  },
  progressPct: {
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
  },
  progressBar: {
    marginBottom: theme.spacing.sm,
  },
  completeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  completeBadgeText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  habitsList: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  habitInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  habitEmoji: {
    fontSize: 18,
  },
  habitName: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  habitSchedule: {
    fontSize: 10,
    fontWeight: '600',
  },
  arrowBtn: {
    padding: 6,
  },
  arrowText: {
    fontSize: 14,
  },
  allHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
  },
  allHabitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  allHabitInfo: {
    gap: 2,
  },
  allHabitName: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  historyCard: {
    paddingVertical: theme.spacing.md,
  },
  historyList: {
    gap: theme.spacing.md,
  },
  historyRow: {
    gap: 6,
  },
  historyRowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  historyLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  historyValues: {
    fontSize: 11,
    fontWeight: '500',
  },
});
