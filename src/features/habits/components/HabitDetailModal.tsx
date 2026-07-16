import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Habit } from '../../../types';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { getLocalDateString } from '../../../utils/date';
import {
  calculateCurrentStreak,
  calculateBestStreak,
  formatRepeatDays,
  getDayLabel,
} from '../utils/streak';

interface HabitDetailModalProps {
  visible: boolean;
  onClose: () => void;
  habit: Habit | undefined;
  onEdit: () => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  visible,
  onClose,
  habit,
  onEdit,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const completions = useWellnessStore((state) => state.habitCompletions);
  const archiveHabit = useWellnessStore((state) => state.archiveHabit);
  const deleteHabit = useWellnessStore((state) => state.deleteHabit);

  if (!habit) return null;

  const currentStreak = calculateCurrentStreak(habit.id, completions, habit.repeatDays);
  const bestStreak = calculateBestStreak(habit.id, completions, habit.repeatDays);

  const completedDates = new Set(
    completions.filter((c) => c.habitId === habit.id).map((c) => c.dateKey)
  );

  const todayKey = getLocalDateString();
  const isCompletedToday = completedDates.has(todayKey);

  // Generate last 7 days chronologically (6 days ago -> today)
  const getPast7Days = (): Date[] => {
    const list: Date[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      list.push(d);
    }
    return list;
  };

  const past7Days = getPast7Days();

  const handleArchive = () => {
    Alert.alert(
      'Alışkanlık Arşivlensin mi?',
      'Bu alışkanlık bugünün planlarından kaldırılacaktır. Geçmiş tamamlama verileriniz korunur.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Arşivle',
          style: 'default',
          onPress: () => {
            archiveHabit(habit.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Kalıcı Olarak Silinsin mi?',
      'Bu işlem geri alınamaz. Alışkanlık ve tüm geçmiş tamamlama verileri kalıcı olarak silinecektir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kalıcı Sil',
          style: 'destructive',
          onPress: () => {
            deleteHabit(habit.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Alışkanlık Detayı">
      <View style={styles.content}>
        {/* Header Hero Area */}
        <View style={styles.heroBlock}>
          <View style={[styles.emojiContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.emojiText}>{habit.emoji}</Text>
          </View>
          <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
          {habit.description ? (
            <Text style={[styles.habitDesc, { color: colors.textSecondary }]}>
              {habit.description}
            </Text>
          ) : null}
        </View>

        {/* Current status info */}
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Bugünkü Durum</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCompletedToday ? colors.successLight : colors.border,
                borderColor: isCompletedToday ? colors.success : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: isCompletedToday ? colors.text : colors.textSecondary },
              ]}
            >
              {isCompletedToday ? '✓ Tamamlandı' : 'Tamamlanmadı'}
            </Text>
          </View>
        </View>

        {/* Streaks Card */}
        <Card style={styles.streakCard}>
          <View style={styles.streakCol}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={[styles.streakVal, { color: colors.text }]}>{currentStreak}</Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Mevcut Seri</Text>
          </View>
          
          <View style={styles.streakDivider} />
          
          <View style={styles.streakCol}>
            <Text style={styles.streakEmoji}>🏆</Text>
            <Text style={[styles.streakVal, { color: colors.text }]}>{bestStreak}</Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>En İyi Seri</Text>
          </View>
        </Card>

        {/* Son 7 Gün Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Son 7 Günlük Plan</Text>
        <Card style={styles.gridCard}>
          <View style={styles.gridRow}>
            {past7Days.map((d) => {
              const dateStr = getLocalDateString(d);
              const dayIndex = d.getDay();
              const isPlanned = habit.repeatDays.includes(dayIndex);
              const isCompleted = completedDates.has(dateStr);
              const isToday = dateStr === todayKey;

              let symbol = '-';
              let color = colors.textSecondary;
              let fontWt: 'normal' | 'bold' = 'normal';

              if (isPlanned) {
                if (isCompleted) {
                  symbol = '✓';
                  color = colors.success;
                  fontWt = 'bold';
                } else if (isToday) {
                  symbol = '○';
                  color = colors.info;
                  fontWt = 'bold';
                } else {
                  symbol = '×';
                  color = colors.danger;
                  fontWt = 'bold';
                }
              }

              return (
                <View key={dateStr} style={styles.gridDayCol}>
                  <Text style={[styles.gridDayLabel, { color: colors.textSecondary }]}>
                    {getDayLabel(dayIndex).charAt(0)}
                  </Text>
                  <View
                    style={[
                      styles.gridSymbolContainer,
                      {
                        backgroundColor: isToday ? colors.backgroundSecondary : 'transparent',
                        borderColor: isToday ? colors.border : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.gridSymbol, { color, fontWeight: fontWt }]}>{symbol}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.gridLegends}>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>✓ Planlı/Tamamlandı</Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>× Kaçırıldı</Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>- Planlı Değil</Text>
          </View>
        </Card>

        {/* Meta Info details */}
        <View style={styles.metaBlock}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            🗓️ Günler: <Text style={{ color: colors.text, fontWeight: '600' }}>{formatRepeatDays(habit.repeatDays)}</Text>
          </Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            🔔 Hatırlatıcı:{' '}
            <Text style={{ color: colors.text, fontWeight: '600' }}>
              {habit.reminderEnabled ? `Açık (${habit.reminderTime})` : 'Kapalı'}
            </Text>
          </Text>
        </View>

        {/* Actions Button Grid */}
        <View style={styles.buttonsRow}>
          <Button
            title="Düzenle"
            variant="outline"
            style={styles.flexBtn}
            onPress={() => {
              onEdit();
              onClose();
            }}
          />
          <Button
            title="Arşivle"
            variant="secondary"
            style={styles.flexBtn}
            onPress={handleArchive}
          />
          <Button
            title="Sil"
            variant="outline"
            textStyle={{ color: colors.danger }}
            style={styles.flexBtn}
            onPress={handleDelete}
          />
        </View>

        <Button title="Kapat" variant="secondary" style={styles.closeBtn} onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: theme.spacing.xs,
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emojiContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  emojiText: {
    fontSize: 32,
  },
  habitName: {
    fontSize: theme.typography.sizes.titleSm,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  habitDesc: {
    fontSize: theme.typography.sizes.bodySm,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: theme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingHorizontal: 4,
  },
  statusLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  streakCol: {
    alignItems: 'center',
    flex: 1,
  },
  streakEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  streakVal: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  streakDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    paddingHorizontal: 4,
  },
  gridCard: {
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.sm,
  },
  gridDayCol: {
    alignItems: 'center',
  },
  gridDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridSymbolContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  gridSymbol: {
    fontSize: 14,
  },
  gridLegends: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: theme.spacing.sm,
    marginTop: 4,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '600',
  },
  metaBlock: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: theme.typography.sizes.bodySm,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  flexBtn: {
    flex: 1,
    minHeight: 40,
  },
  closeBtn: {
    marginTop: theme.spacing.sm,
    width: '100%',
  },
});
