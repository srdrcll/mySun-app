import { MoodType, Mood, MoodEntry } from '../../../types';
import { getLocalDateString } from '../../../utils/date';

export interface MoodDetails {
  mood: MoodType;
  emoji: string;
  label: string;
  color: string;
  accessibilityLabel: string;
}

export const MOOD_LIST: MoodDetails[] = [
  {
    mood: 'great',
    emoji: '😄',
    label: 'Harika',
    color: '#10B981', // green
    accessibilityLabel: 'Harika ruh hali',
  },
  {
    mood: 'good',
    emoji: '🙂',
    label: 'İyi',
    color: '#3B82F6', // blue
    accessibilityLabel: 'İyi ruh hali',
  },
  {
    mood: 'neutral',
    emoji: '😐',
    label: 'Normal',
    color: '#6B7280', // gray
    accessibilityLabel: 'Normal ruh hali',
  },
  {
    mood: 'bad',
    emoji: '😔',
    label: 'Kötü',
    color: '#F59E0B', // amber
    accessibilityLabel: 'Kötü ruh hali',
  },
  {
    mood: 'difficult',
    emoji: '😣',
    label: 'Zor',
    color: '#EF4444', // red
    accessibilityLabel: 'Zor ruh hali',
  },
];

export const getMoodDetails = (mood: MoodType): MoodDetails => {
  const match = MOOD_LIST.find((m) => m.mood === mood);
  return match || MOOD_LIST[2]; // fallback to neutral
};

// Maps old numeric mood (1-5) to rich MoodDetails
export const getMoodDetailsByNumeric = (val: number): MoodDetails | undefined => {
  if (val === 5) return MOOD_LIST[0]; // great
  if (val === 4) return MOOD_LIST[1]; // good
  if (val === 3) return MOOD_LIST[2]; // neutral
  if (val === 2) return MOOD_LIST[3]; // bad
  if (val === 1) return MOOD_LIST[4]; // difficult
  return undefined;
};

// Maps rich MoodType to old numeric mood (1-5)
export const getNumericMoodValue = (mood: MoodType): Mood => {
  const mapping: Record<MoodType, Mood> = {
    great: 5,
    good: 4,
    neutral: 3,
    bad: 2,
    difficult: 1,
  };
  return mapping[mood];
};

// Calculates how many days had which final mood over the last N days
export const calculateMoodFrequencies = (
  entries: MoodEntry[],
  daysCount: number = 7
): Record<MoodType, number> => {
  const freq: Record<MoodType, number> = {
    great: 0,
    good: 0,
    neutral: 0,
    bad: 0,
    difficult: 0,
  };

  const today = new Date();
  
  // For each of the last N days, find the latest mood entry
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = getLocalDateString(d);

    const dayEntries = entries.filter((e) => e.dateKey === dateKey);
    if (dayEntries.length > 0) {
      // Find the latest one for this day based on timestamp
      const sorted = [...dayEntries].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const latestMood = sorted[0].mood;
      freq[latestMood] = (freq[latestMood] || 0) + 1;
    }
  }

  return freq;
};
