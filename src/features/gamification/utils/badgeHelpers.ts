import { getLocalDateString } from '../../../utils/date';

export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
}

/**
 * Calculates which badges are unlocked based on current wellness state.
 *
 * Badges included:
 * 1. Su Canavarı 💧 -> Today's water sum >= waterTarget
 * 2. İstikrarlı 🌱 -> Completed at least one habit for 7 consecutive days
 * 3. Erken Kalkan 🌅 -> Latest sleep entry's wake time hour is before 08:00
 * 4. Derin Uyku 😴 -> Hitted daily sleep target today
 * 5. Günlükçü 📝 -> Logged mood with a note today
 */
export const getCalculatedBadges = (state: any): Badge[] => {
  const todayKey = getLocalDateString();

  // 1. Su Canavarı 💧
  const todayRecord = state.history[todayKey] || {};
  const currentWater = todayRecord.waterEntries
    ? todayRecord.waterEntries.reduce((sum: number, e: any) => sum + e.amount, 0)
    : todayRecord.water || 0;
  const isWaterTargetAchieved = currentWater >= state.waterTarget;

  // 2. İstikrarlı 🌱 (7-day habit completion streak)
  let hasSevenDayHabitStreak = false;
  if (state.habits && state.habits.length > 0) {
    const today = new Date();
    const last7DaysKeys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7DaysKeys.push(getLocalDateString(d));
    }

    // Check each habit
    for (const habit of state.habits) {
      if (!habit.isActive) continue;
      
      // Count completions in the last 7 calendar days
      const completedInLast7Days = state.habitCompletions.filter(
        (c: any) => c.habitId === habit.id && last7DaysKeys.includes(c.dateKey)
      );

      // If completed on all last 7 calendar days, streak is satisfied!
      if (completedInLast7Days.length >= 7) {
        hasSevenDayHabitStreak = true;
        break;
      }
    }
  }

  // 3. Erken Kalkan 🌅
  let isEarlyRiser = false;
  const sleepEntries = state.sleepEntries || [];
  if (sleepEntries.length > 0) {
    // Get latest sleep entry sorted by wakeTime
    const sorted = [...sleepEntries].sort(
      (a: any, b: any) => new Date(b.wakeTime).getTime() - new Date(a.wakeTime).getTime()
    );
    const latest = sorted[0];
    if (latest && latest.wakeTime) {
      try {
        const wakeHour = new Date(latest.wakeTime).getHours();
        if (wakeHour < 8) {
          isEarlyRiser = true;
        }
      } catch {}
    }
  }

  // 4. Derin Uyku 😴
  const currentSleep = todayRecord.sleep || 0;
  const isSleepTargetAchieved = currentSleep >= state.sleepTarget;

  // 5. Günlükçü 📝
  const moodEntries = state.moodEntries || [];
  const todayMoodEntries = moodEntries.filter((e: any) => e.dateKey === todayKey);
  const hasMoodNoteToday = todayMoodEntries.some((e: any) => e.note && e.note.trim().length > 0);

  return [
    {
      id: 'water_champion',
      title: 'Su Canavarı',
      description: 'Günlük su tüketim hedefine ulaştın.',
      emoji: '💧',
      unlocked: isWaterTargetAchieved,
    },
    {
      id: 'habit_streak',
      title: 'İstikrarlı',
      description: 'Bir alışkanlığı 7 gün üst üste tamamladın.',
      emoji: '🌱',
      unlocked: hasSevenDayHabitStreak,
    },
    {
      id: 'early_riser',
      title: 'Erken Kalkan',
      description: 'Günü erken karşıladın (Uyanış 08:00 öncesi).',
      emoji: '🌅',
      unlocked: isEarlyRiser,
    },
    {
      id: 'deep_sleep',
      title: 'Derin Uyku',
      description: 'Günlük uyku hedefini yakaladın.',
      emoji: '😴',
      unlocked: isSleepTargetAchieved,
    },
    {
      id: 'daily_journal',
      title: 'Günlükçü',
      description: 'Bugün ruh halinin yanına mini bir günlük notu iliştirdin.',
      emoji: '📝',
      unlocked: hasMoodNoteToday,
    },
  ];
};
