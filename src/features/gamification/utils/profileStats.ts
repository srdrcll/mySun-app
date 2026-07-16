import { getLocalDateString } from '../../../utils/date';

export interface ProfilePeriodStats {
  waterLiters: number;
  sleepAverageHours: number;
  habitCompletionsCount: number;
  dominantMoodEmoji: string;
  dominantMoodLabel: string;
}

const MOOD_MAP: { [key: number]: { emoji: string; label: string } } = {
  1: { emoji: '😢', label: 'Kötü' },
  2: { emoji: '😔', label: 'Halsiz' },
  3: { emoji: '😐', label: 'Nötr' },
  4: { emoji: '😊', label: 'İyi' },
  5: { emoji: '😁', label: 'Harika' },
};

export const calculateProfileStats = (state: any): { monthly: ProfilePeriodStats; yearly: ProfilePeriodStats } => {
  const today = new Date();
  const yearStr = String(today.getFullYear());
  const monthStr = `${yearStr}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const historyKeys = Object.keys(state.history || {});
  
  // Helper to calculate stats for a given prefix (e.g. YYYY-MM or YYYY)
  const getStatsForPrefix = (prefix: string): ProfilePeriodStats => {
    let totalWaterMl = 0;
    let totalSleepDecimalHours = 0;
    let sleepDaysCount = 0;
    const moodValues: number[] = [];

    // 1. Scan history keys starting with prefix
    historyKeys.forEach((key) => {
      if (key.startsWith(prefix)) {
        const record = state.history[key];
        if (record) {
          // Water
          if (record.waterEntries) {
            totalWaterMl += record.waterEntries.reduce((sum: number, e: any) => sum + e.amount, 0);
          } else if (record.water) {
            totalWaterMl += record.water;
          }

          // Sleep
          if (typeof record.sleep === 'number' && record.sleep > 0) {
            totalSleepDecimalHours += record.sleep;
            sleepDaysCount++;
          }

          // Mood
          if (typeof record.mood === 'number' && record.mood > 0) {
            moodValues.push(record.mood);
          }
        }
      }
    });

    // 2. Scan completions starting with prefix (in case history record is empty but completions exist)
    const completions = state.habitCompletions || [];
    const completionsCount = completions.filter((c: any) => c.dateKey.startsWith(prefix)).length;

    // 3. Dominant Mood
    let domEmoji = '✨';
    let domLabel = 'Veri Yok';
    if (moodValues.length > 0) {
      const counts: { [key: number]: number } = {};
      let maxCount = 0;
      let maxVal = 3;

      moodValues.forEach((val) => {
        counts[val] = (counts[val] || 0) + 1;
        if (counts[val] > maxCount) {
          maxCount = counts[val];
          maxVal = val;
        }
      });

      const details = MOOD_MAP[maxVal];
      if (details) {
        domEmoji = details.emoji;
        domLabel = details.label;
      }
    }

    return {
      waterLiters: Number((totalWaterMl / 1000).toFixed(1)),
      sleepAverageHours: sleepDaysCount > 0 ? Number((totalSleepDecimalHours / sleepDaysCount).toFixed(1)) : 0,
      habitCompletionsCount: completionsCount,
      dominantMoodEmoji: domEmoji,
      dominantMoodLabel: domLabel,
    };
  };

  return {
    monthly: getStatsForPrefix(monthStr),
    yearly: getStatsForPrefix(yearStr),
  };
};
