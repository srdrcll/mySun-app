import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { MoodType } from '../../../types';
import { getLocalDateString } from '../../../utils/date';
import { MOOD_LIST, getMoodDetails } from '../../mood/utils/moodHelpers';

interface MoodCardProps {
  onPress: () => void;
  onSelectMood: (mood: MoodType) => void;
}

export const MoodCard: React.FC<MoodCardProps> = ({ onPress, onSelectMood }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const entries = useWellnessStore((state) => state.moodEntries);

  const todayKey = getLocalDateString();
  
  // Find today's latest mood entry
  const todayEntries = entries.filter((e) => e.dateKey === todayKey);
  const latestEntry = todayEntries.length > 0
    ? [...todayEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : undefined;

  const details = latestEntry ? getMoodDetails(latestEntry.mood) : null;

  return (
    <Card style={styles.card} onPress={onPress}>
      <Text style={[styles.title, { color: colors.text }]}>😊 Ruh Hali</Text>

      {latestEntry && (
        <View style={styles.selectionRow}>
          <View style={styles.selectedMoodBlock}>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Son kayıt:</Text>
            <View
              style={[
                styles.moodBadge,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.badgeEmoji}>{details?.emoji}</Text>
              <Text style={[styles.badgeLabel, { color: colors.text }]}>
                {details?.label}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={styles.changeBtn}
          >
            <Text style={[styles.changeText, { color: colors.primary }]}>Detay gör</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.contentContainer, latestEntry && { marginTop: theme.spacing.sm }]}>
        <Text style={[styles.questionText, { color: colors.textSecondary, marginBottom: 8 }]}>
          {latestEntry ? 'Ruh halinizi güncelleyin:' : 'Bugün nasıl hissediyorsun?'}
        </Text>
        <View style={styles.emojiRow}>
          {MOOD_LIST.map((m) => (
            <TouchableOpacity
              key={m.mood}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={m.accessibilityLabel}
              style={[
                styles.emojiBtn,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent card navigation when selecting an emoji
                onSelectMood(m.mood);
              }}
            >
              <Text style={styles.emojiChar}>{m.emoji}</Text>
              <Text style={[styles.emojiLabel, { color: colors.textSecondary }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
  contentContainer: {
    marginTop: 2,
  },
  questionText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.bodySm,
    marginBottom: theme.spacing.md,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  emojiBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
  },
  emojiChar: {
    fontSize: 22,
    marginBottom: 4,
  },
  emojiLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  selectedMoodBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  changeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
  },
});
