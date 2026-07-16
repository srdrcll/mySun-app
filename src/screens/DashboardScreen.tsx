import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Text,
  Keyboard,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { Confetti } from '../components/Confetti';
import { getLocalDateString } from '../utils/date';
import { MoodType, MoodEntry } from '../types';

// Modular Feature Components
import { GreetingHeader } from '../features/dashboard/components/GreetingHeader';
import { DailySummarySection } from '../features/dashboard/components/DailySummarySection';
import { WaterCard } from '../features/dashboard/components/WaterCard';
import { HabitsCard } from '../features/dashboard/components/HabitsCard';
import { MoodCard } from '../features/dashboard/components/MoodCard';
import { SleepCard } from '../features/dashboard/components/SleepCard';
import { DailyMessageCard } from '../features/dashboard/components/DailyMessageCard';

// Mood Subcomponents
import { MoodLogModal } from '../features/mood/components/MoodLogModal';

interface DashboardScreenProps {
  onWaterCardPress: () => void;
  onHabitsCardPress: () => void;
  onMoodCardPress: () => void;
  onSleepCardPress: () => void;
  onDailyMessageCardPress: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onWaterCardPress,
  onHabitsCardPress,
  onMoodCardPress,
  onSleepCardPress,
  onDailyMessageCardPress,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const setTheme = useWellnessStore((state) => state.setTheme);
  const habits = useWellnessStore((state) => state.habits);
  const completions = useWellnessStore((state) => state.habitCompletions);
  const waterTarget = useWellnessStore((state) => state.waterTarget);
  const history = useWellnessStore((state) => state.history);
  
  // Actions
  const addWaterEntry = useWellnessStore((state) => state.addWaterEntry);
  const undoLastWaterEntry = useWellnessStore((state) => state.undoLastWaterEntry);
  const toggleHabitCompletion = useWellnessStore((state) => state.toggleHabitCompletion);
  const createHabit = useWellnessStore((state) => state.createHabit);
  const deleteHabit = useWellnessStore((state) => state.deleteHabit);

  const notificationsEnabled = useWellnessStore((state) => state.notificationsEnabled);
  const setNotificationsEnabled = useWellnessStore((state) => state.setNotificationsEnabled);
  const resetAllData = useWellnessStore((state) => state.resetAllData);

  // States for shared modals
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [showCustomWater, setShowCustomWater] = useState(false);
  const [customWaterText, setCustomWaterText] = useState('');
  
  const [habitsModalVisible, setHabitsModalVisible] = useState(false);
  const [newHabitText, setNewHabitText] = useState('');

  // States for mood logging
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [initialMood, setInitialMood] = useState<MoodType>('neutral');

  // Local state for Undo banner
  const [undoVisible, setUndoVisible] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  // Scroll View reference
  const scrollViewRef = useRef<ScrollView>(null);

  const colors = theme[currentTheme].colors;

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (undoTimer) clearTimeout(undoTimer);
    };
  }, [undoTimer]);

  const [confettiActive, setConfettiActive] = useState(false);

  const todayKey = getLocalDateString();
  const todayDayOfWeek = new Date().getDay();

  // Active habits list
  const activeHabits = habits.filter((h) => h.isActive);

  // Today's planned habits
  const todayPlannedHabits = activeHabits.filter((h) => h.repeatDays.includes(todayDayOfWeek));

  // Today's completed habit IDs
  const completedIds = new Set(
    completions.filter((c) => c.dateKey === todayKey).map((c) => c.habitId)
  );

  const todayRecord = history[todayKey] || { water: 0, waterEntries: [] };
  const currentWater = todayRecord.waterEntries
    ? todayRecord.waterEntries.reduce((sum: number, e: any) => sum + e.amount, 0)
    : (todayRecord as any).water || 0;

  const completedCount = todayPlannedHabits.filter((h) => completedIds.has(h.id)).length;
  const plannedCount = todayPlannedHabits.length;

  const prevWaterTargetAchieved = useRef(currentWater >= waterTarget);
  const prevHabitsAllCompleted = useRef(plannedCount > 0 && completedCount === plannedCount);

  useEffect(() => {
    const isWaterAchieved = currentWater >= waterTarget;
    const isHabitsAchieved = plannedCount > 0 && completedCount === plannedCount;

    if (isWaterAchieved && !prevWaterTargetAchieved.current) {
      setConfettiActive(true);
    }
    if (isHabitsAchieved && !prevHabitsAllCompleted.current) {
      setConfettiActive(true);
    }

    prevWaterTargetAchieved.current = isWaterAchieved;
    prevHabitsAllCompleted.current = isHabitsAchieved;
  }, [currentWater, waterTarget, completedCount, plannedCount]);

  const triggerUndoBanner = (amount: number) => {
    if (undoTimer) clearTimeout(undoTimer);
    
    setUndoMessage(`${amount} ml eklendi`);
    setUndoVisible(true);

    const timer = setTimeout(() => {
      setUndoVisible(false);
    }, 5000);
    setUndoTimer(timer);
  };

  const handleAddWater = (amount: number) => {
    if (amount > 5000) {
      Alert.alert(
        'Yüksek Miktar',
        'Bu miktar oldukça yüksek görünüyor. Yine de eklemek istiyor musun?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Ekle',
            onPress: () => {
              addWaterEntry(amount);
              triggerUndoBanner(amount);
              setWaterModalVisible(false);
              setShowCustomWater(false);
              setCustomWaterText('');
            },
          },
        ]
      );
    } else {
      addWaterEntry(amount);
      triggerUndoBanner(amount);
      setWaterModalVisible(false);
      setShowCustomWater(false);
      setCustomWaterText('');
    }
  };

  const handleAddCustomWater = () => {
    const amount = parseInt(customWaterText);
    if (!isNaN(amount) && amount > 0) {
      handleAddWater(amount);
      Keyboard.dismiss();
    }
  };

  const handleUndo = () => {
    undoLastWaterEntry(todayKey);
    setUndoVisible(false);
    Alert.alert('Geri Alındı', 'Son eklenen su kaydı başarıyla iptal edildi. 💧');
  };

  const handleAddCustomHabit = () => {
    const text = newHabitText.trim();
    if (text) {
      createHabit({
        name: text,
        emoji: '🌱',
        description: '',
        repeatDays: [0, 1, 2, 3, 4, 5, 6],
        reminderEnabled: false,
        reminderTime: '12:00',
      });
      setNewHabitText('');
    }
  };

  const handleQuickMoodSelect = (mood: MoodType) => {
    setInitialMood(mood);
    setMoodModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header / Karşılama Alanı */}
        <GreetingHeader />

        {/* 2. Günlük Özet Halka Kartı */}
        <DailySummarySection />

        {/* 3. Su Kartı */}
        <WaterCard
          onPress={onWaterCardPress}
          onAddCustomWater={() => {
            setShowCustomWater(true);
            setWaterModalVisible(true);
          }}
        />

        {/* 4. Alışkanlıklar Kartı */}
        <HabitsCard onPress={onHabitsCardPress} />

        {/* 5. Ruh Hali Kartı */}
        <MoodCard
          onPress={onMoodCardPress}
          onSelectMood={handleQuickMoodSelect}
        />

        {/* 6. Uyku Kartı */}
        <SleepCard onPress={onSleepCardPress} />

        {/* 8. Bugünün Mesajı */}
        <DailyMessageCard onPress={onDailyMessageCardPress} />

      </ScrollView>

      {/* Floating Undo Banner */}
      {undoVisible && (
        <View style={[styles.undoBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.undoText, { color: colors.text }]}>{undoMessage}</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.undoAction} onPress={handleUndo}>
            <Text style={[styles.undoActionText, { color: colors.primary }]}>GERİ AL</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SHARED WATER MODAL */}
      <Modal
        visible={waterModalVisible}
        onClose={() => {
          setWaterModalVisible(false);
          setShowCustomWater(false);
          setCustomWaterText('');
        }}
        title="Su Tüketimi Ekle"
      >
        <View style={styles.modalContent}>
          {!showCustomWater ? (
            <View style={styles.presetButtonsCol}>
              <Button
                title="+250 ml (Bardak)"
                variant="outline"
                style={styles.presetBtn}
                onPress={() => handleAddWater(250)}
              />
              <Button
                title="+500 ml (Şişe)"
                variant="outline"
                style={styles.presetBtn}
                onPress={() => handleAddWater(500)}
              />
              <Button
                title="Özel Miktar Yaz"
                variant="secondary"
                style={styles.presetBtn}
                onPress={() => setShowCustomWater(true)}
              />
            </View>
          ) : (
            <View style={styles.customInputCol}>
              <Input
                label="Miktar (ml)"
                placeholder="Örn: 330, 750..."
                keyboardType="numeric"
                value={customWaterText}
                onChangeText={setCustomWaterText}
                autoFocus
              />
              <View style={styles.customButtonsRow}>
                <Button
                  title="Geri"
                  variant="outline"
                  style={styles.flexBtn}
                  onPress={() => {
                    setShowCustomWater(false);
                    setCustomWaterText('');
                  }}
                />
                <Button
                  title="Ekle"
                  variant="primary"
                  style={styles.flexBtn}
                  disabled={!customWaterText.trim() || isNaN(parseInt(customWaterText)) || parseInt(customWaterText) <= 0}
                  onPress={handleAddCustomWater}
                />
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* SHARED HABITS QUICK CHECKLIST MODAL */}
      <Modal
        visible={habitsModalVisible}
        onClose={() => setHabitsModalVisible(false)}
        title="Bugünkü Alışkanlıklar"
      >
        <View style={styles.modalContent}>
          {todayPlannedHabits.length === 0 ? (
            <EmptyState
              title="Planlanmış Alışkanlık Yok"
              description="Bugün için planlanmış aktif bir rutin bulunmuyor."
            />
          ) : (
            <ScrollView style={styles.modalHabitsScrollView}>
              {todayPlannedHabits.map((habit) => {
                const isCompleted = completedIds.has(habit.id);
                return (
                  <TouchableOpacity
                    key={habit.id}
                    activeOpacity={0.7}
                    style={[
                      styles.modalHabitRow,
                      {
                        backgroundColor: isCompleted ? colors.successLight : 'transparent',
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => toggleHabitCompletion(habit.id, todayKey)}
                  >
                    <Text
                      style={[
                        styles.modalHabitText,
                        {
                          color: colors.text,
                          textDecorationLine: isCompleted ? 'line-through' : 'none',
                          opacity: isCompleted ? 0.7 : 1,
                        },
                      ]}
                    >
                      {habit.emoji} {habit.name}
                    </Text>
                    <View
                      style={[
                        styles.modalCheckbox,
                        {
                          borderColor: isCompleted ? colors.success : colors.textSecondary,
                          backgroundColor: isCompleted ? colors.success : 'transparent',
                        },
                      ]}
                    >
                      {isCompleted && <Text style={styles.checkMarkSymbol}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          <Button
            title="Tüm Alışkanlıkları Gör"
            variant="primary"
            style={styles.closeHabitModalBtn}
            onPress={() => {
              setHabitsModalVisible(false);
              onHabitsCardPress();
            }}
          />
          <Button
            title="Kapat"
            variant="outline"
            style={{ marginTop: 8 }}
            onPress={() => setHabitsModalVisible(false)}
          />
        </View>
      </Modal>

      {/* QUICK MOOD LOG MODAL */}
      <MoodLogModal
        visible={moodModalVisible}
        onClose={() => setMoodModalVisible(false)}
        initialMood={initialMood}
      />

      {/* Confetti Celebration Overlay */}
      <Confetti
        active={confettiActive}
        onAnimationEnd={() => setConfettiActive(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  addHabitCard: {
    gap: theme.spacing.xs,
  },
  addHabitTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.xs,
  },
  addHabitRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  flexInput: {
    flex: 1,
    marginBottom: 0,
  },
  addBtnSmall: {
    width: 48,
    minHeight: 48,
  },
  manageHabitsList: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  manageHabitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  manageHabitText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 22,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  settingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  lastToggleRow: {
    marginBottom: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.semibold,
  },
  resetBtn: {
    marginTop: theme.spacing.sm,
  },
  modalContent: {
    paddingVertical: theme.spacing.xs,
  },
  presetButtonsCol: {
    gap: theme.spacing.sm,
  },
  presetBtn: {
    width: '100%',
  },
  customInputCol: {
    width: '100%',
  },
  customButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  flexBtn: {
    flex: 1,
  },
  modalHabitsScrollView: {
    maxHeight: 240,
    marginBottom: theme.spacing.md,
  },
  modalHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    marginBottom: theme.spacing.xs,
  },
  modalHabitText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '500',
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  modalCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkSymbol: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  closeHabitModalBtn: {
    marginTop: theme.spacing.xs,
  },
  undoBanner: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    left: theme.spacing.md,
    right: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  undoText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  undoAction: {
    padding: 4,
  },
  undoActionText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
});
