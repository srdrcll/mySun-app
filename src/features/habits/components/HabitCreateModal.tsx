import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Habit } from '../../../types';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { HABITS_WEEKDAYS } from '../utils/streak';

interface HabitCreateModalProps {
  visible: boolean;
  onClose: () => void;
  habitToEdit?: Habit;
}

const PRESET_EMOJIS = ['🌱', '💊', '💧', '🚶', '🏃', '🧘', '📚', '🧴', '🥗', '🌙', '☀️', '❤️'];

export const HabitCreateModal: React.FC<HabitCreateModalProps> = ({
  visible,
  onClose,
  habitToEdit,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const createHabit = useWellnessStore((state) => state.createHabit);
  const updateHabit = useWellnessStore((state) => state.updateHabit);

  // Form states
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌱');
  const [description, setDescription] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');

  // Load values when editing
  useEffect(() => {
    if (visible) {
      if (habitToEdit) {
        setName(habitToEdit.name);
        setEmoji(habitToEdit.emoji);
        setDescription(habitToEdit.description || '');
        setRepeatDays(habitToEdit.repeatDays);
        setReminderEnabled(habitToEdit.reminderEnabled);
        setReminderTime(habitToEdit.reminderTime || '09:00');
      } else {
        // Defaults for new habit
        setName('');
        setEmoji('🌱');
        setDescription('');
        setRepeatDays([1, 2, 3, 4, 5]); // Default weekday
        setReminderEnabled(false);
        setReminderTime('09:00');
      }
    }
  }, [visible, habitToEdit]);

  const handleToggleDay = (dayValue: number) => {
    if (repeatDays.includes(dayValue)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayValue));
    } else {
      setRepeatDays([...repeatDays, dayValue]);
    }
  };

  const setShortcutDays = (type: 'all' | 'weekdays' | 'weekends') => {
    if (type === 'all') {
      setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (type === 'weekdays') {
      setRepeatDays([1, 2, 3, 4, 5]);
    } else if (type === 'weekends') {
      setRepeatDays([6, 0]);
    }
  };

  const adjustReminderTime = (hourDiff: number, minDiff: number) => {
    let [h, m] = reminderTime.split(':').map(Number);
    
    h = (h + hourDiff + 24) % 24;
    m = (m + minDiff + 60) % 60;

    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setReminderTime(formatted);
  };

  const handleSave = () => {
    const cleanedName = name.trim();
    if (!cleanedName) {
      Alert.alert('Hata', 'Alışkanlık adı boş olamaz.');
      return;
    }
    if (cleanedName.length > 50) {
      Alert.alert('Hata', 'Alışkanlık adı en fazla 50 karakter olmalıdır.');
      return;
    }
    if (repeatDays.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir tekrar günü seçin.');
      return;
    }

    const payload = {
      name: cleanedName,
      emoji,
      description: description.trim(),
      repeatDays,
      reminderEnabled,
      reminderTime,
    };

    if (habitToEdit) {
      updateHabit(habitToEdit.id, payload);
    } else {
      createHabit(payload);
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={habitToEdit ? 'Alışkanlığı Düzenle' : 'Yeni Alışkanlık Oluştur'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Name Input */}
        <Input
          label="Alışkanlık Adı (Maks 50 karakter)"
          placeholder="Örn: Meditasyon yap, Su iç..."
          value={name}
          onChangeText={setName}
          maxLength={50}
        />

        {/* Emoji Selector */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Emoji / İkon</Text>
        <View style={styles.emojiGrid}>
          {PRESET_EMOJIS.map((e) => (
            <TouchableOpacity
              key={e}
              activeOpacity={0.7}
              style={[
                styles.emojiBtn,
                {
                  borderColor: emoji === e ? colors.primary : colors.border,
                  backgroundColor: emoji === e ? colors.primaryLight : 'transparent',
                },
              ]}
              onPress={() => setEmoji(e)}
            >
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Emoji Input */}
        <Input
          label="Veya Kendi Belirlediğiniz Emoji"
          placeholder="Örn: 🧘, 🏃, 🍎"
          value={emoji}
          onChangeText={(val) => {
            const charArray = Array.from(val);
            if (charArray.length > 0) {
              setEmoji(charArray[0]);
            } else {
              setEmoji('');
            }
          }}
          maxLength={4}
        />

        {/* Repeat Days Selection */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Tekrar Günleri</Text>
        
        {/* Shortcuts */}
        <View style={styles.shortcutsRow}>
          <Button
            title="Her Gün"
            variant="outline"
            size="sm"
            style={styles.shortcutBtn}
            onPress={() => setShortcutDays('all')}
          />
          <Button
            title="Hafta İçi"
            variant="outline"
            size="sm"
            style={styles.shortcutBtn}
            onPress={() => setShortcutDays('weekdays')}
          />
          <Button
            title="Hafta Sonu"
            variant="outline"
            size="sm"
            style={styles.shortcutBtn}
            onPress={() => setShortcutDays('weekends')}
          />
        </View>

        {/* Days circle row */}
        <View style={styles.daysRow}>
          {HABITS_WEEKDAYS.map((day) => {
            const isSelected = repeatDays.includes(day.value);
            return (
              <TouchableOpacity
                key={day.value}
                activeOpacity={0.7}
                style={[
                  styles.dayCircle,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => handleToggleDay(day.value)}
              >
                <Text
                  style={[
                    styles.dayCircleText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Description Input */}
        <Input
          label="Açıklama (Opsiyonel)"
          placeholder="Örn: Günde 10 dakika nefes egzersizi..."
          value={description}
          onChangeText={setDescription}
          maxLength={100}
        />

        {/* Reminder Settings */}
        <View style={styles.reminderRow}>
          <Text style={[styles.reminderLabel, { color: colors.text }]}>Hatırlatıcı Bildirim</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.toggleToggle,
              {
                borderColor: colors.border,
                backgroundColor: reminderEnabled ? colors.primaryLight : 'transparent',
              },
            ]}
            onPress={() => setReminderEnabled(!reminderEnabled)}
          >
            <Text style={{ color: reminderEnabled ? colors.primary : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
              {reminderEnabled ? 'AÇIK' : 'KAPALI'}
            </Text>
          </TouchableOpacity>
        </View>

        {reminderEnabled && (
          <View style={styles.reminderTimeRow}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Hatırlatma Saati</Text>
            <View style={styles.timeControls}>
              <Button
                title="-1 sa"
                size="sm"
                variant="outline"
                style={styles.timeAdjustBtn}
                onPress={() => adjustReminderTime(-1, 0)}
              />
              <Text style={[styles.timeDisplay, { color: colors.text }]}>{reminderTime}</Text>
              <Button
                title="+1 sa"
                size="sm"
                variant="outline"
                style={styles.timeAdjustBtn}
                onPress={() => adjustReminderTime(1, 0)}
              />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button title="İptal" variant="outline" style={styles.flexBtn} onPress={onClose} />
          <Button title="Kaydet" variant="primary" style={styles.flexBtn} onPress={handleSave} />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '700',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 20,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  shortcutBtn: {
    flex: 1,
    minHeight: 32,
    paddingHorizontal: 0,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleText: {
    fontSize: 10,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: theme.spacing.sm,
  },
  reminderLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  toggleToggle: {
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
  },
  reminderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  timeLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeDisplay: {
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
    width: 50,
    textAlign: 'center',
  },
  timeAdjustBtn: {
    minWidth: 48,
    minHeight: 32,
    paddingHorizontal: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  flexBtn: {
    flex: 1,
  },
});
