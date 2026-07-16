import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Alert,
} from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { MoodType, MoodEntry } from '../../../types';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { MOOD_LIST } from '../utils/moodHelpers';

interface MoodLogModalProps {
  visible: boolean;
  onClose: () => void;
  entryToEdit?: MoodEntry;
  initialMood?: MoodType;
}

export const MoodLogModal: React.FC<MoodLogModalProps> = ({
  visible,
  onClose,
  entryToEdit,
  initialMood,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const addMoodEntry = useWellnessStore((state) => state.addMoodEntry);
  const updateMoodEntry = useWellnessStore((state) => state.updateMoodEntry);

  const [selectedMood, setSelectedMood] = useState<MoodType>('neutral');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      if (entryToEdit) {
        setSelectedMood(entryToEdit.mood);
        setNote(entryToEdit.note || '');
      } else {
        setSelectedMood(initialMood || 'neutral');
        setNote('');
      }
    }
  }, [visible, entryToEdit, initialMood]);

  const handleSave = () => {
    // Sanitize note: remove excess whitespaces, empty notes are stored as empty strings
    const cleanedNote = note.trim();
    if (cleanedNote.length > 500) {
      Alert.alert('Hata', 'Not alanı en fazla 500 karakter olmalıdır.');
      return;
    }

    if (entryToEdit) {
      // Privacy-conscious update (no console logging)
      updateMoodEntry(entryToEdit.id, selectedMood, cleanedNote);
    } else {
      addMoodEntry(selectedMood, cleanedNote);
    }
    
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={entryToEdit ? 'Ruh Halini Düzenle' : 'Ruh Halini Kaydet'}
    >
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Şu an nasıl hissediyorsun?
        </Text>
        
        {/* Mood select grid */}
        <View style={styles.moodRow}>
          {MOOD_LIST.map((m) => {
            const isSelected = selectedMood === m.mood;
            return (
              <TouchableOpacity
                key={m.mood}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={m.accessibilityLabel}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.moodBtn,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primaryLight : 'transparent',
                  },
                ]}
                onPress={() => setSelectedMood(m.mood)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note input field */}
        <View style={styles.inputContainer}>
          <Input
            label="Bir şeyler eklemek ister misin? (Günlük notu)"
            placeholder="Örn: Bugün verimli geçti, kendimi dingin hissediyorum..."
            value={note}
            onChangeText={setNote}
            maxLength={500}
            multiline
            numberOfLines={3}
            containerStyle={styles.noteInput}
          />
          <Text style={[styles.charCounter, { color: colors.textSecondary }]}>
            {note.length} / 500
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button title="İptal" variant="outline" style={styles.flexBtn} onPress={onClose} />
          <Button title="Kaydet" variant="primary" style={styles.flexBtn} onPress={handleSave} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  moodBtn: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    gap: 4,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 10,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  noteInput: {
    marginBottom: 4,
  },
  charCounter: {
    fontSize: 10,
    fontWeight: '600',
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  flexBtn: {
    flex: 1,
  },
});
