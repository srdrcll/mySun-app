import { HabitCompletion } from '../../../types';
import { getLocalDateString } from '../../../utils/date';

export const HABITS_WEEKDAYS = [
  { label: 'Paz', value: 0 },
  { label: 'Pzt', value: 1 },
  { label: 'Sal', value: 2 },
  { label: 'Çar', value: 3 },
  { label: 'Per', value: 4 },
  { label: 'Cum', value: 5 },
  { label: 'Cmt', value: 6 },
];

export const getDayLabel = (dayIndex: number): string => {
  const match = HABITS_WEEKDAYS.find((d) => d.value === dayIndex);
  return match ? match.label : '';
};

// Returns a comma-separated string of planned days, e.g. "Pzt • Çar • Cum" or "Her gün"
export const formatRepeatDays = (repeatDays: number[]): string => {
  if (!repeatDays || repeatDays.length === 0) return 'Seçilmedi';
  if (repeatDays.length === 7) return 'Her gün';
  
  // Custom sorting so Monday comes first in Turkish UI (1, 2, 3, 4, 5, 6, 0)
  const orderedDays = [...repeatDays].sort((a, b) => {
    const valA = a === 0 ? 7 : a;
    const valB = b === 0 ? 7 : b;
    return valA - valB;
  });

  return orderedDays.map(getDayLabel).join(' • ');
};

// Streak calculation: Only checks planned days, doesn't break if today is planned but not completed yet.
export const calculateCurrentStreak = (
  habitId: string,
  completions: HabitCompletion[],
  repeatDays: number[]
): number => {
  if (!repeatDays || repeatDays.length === 0) return 0;

  const completedDates = new Set(
    completions
      .filter((c) => c.habitId === habitId)
      .map((c) => c.dateKey)
  );

  let streak = 0;
  const checkDate = new Date();
  const todayKey = getLocalDateString(checkDate);

  const todayDayOfWeek = checkDate.getDay();
  const isTodayPlanned = repeatDays.includes(todayDayOfWeek);
  const completedToday = completedDates.has(todayKey);

  if (isTodayPlanned) {
    if (completedToday) {
      streak++;
    }
    // If not completed today, it doesn't break the streak yet as today is still active.
  }

  // Move back to yesterday
  checkDate.setDate(checkDate.getDate() - 1);

  // Scan up to 365 days backwards
  for (let i = 0; i < 365; i++) {
    const dateKey = getLocalDateString(checkDate);
    const dayOfWeek = checkDate.getDay();

    if (repeatDays.includes(dayOfWeek)) {
      if (completedDates.has(dateKey)) {
        streak++;
      } else {
        // Streak is broken at this first uncompleted planned day
        break;
      }
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
};

// Best Streak: Scan chronologically from 90 days ago to find maximum consecutive completions on planned days.
export const calculateBestStreak = (
  habitId: string,
  completions: HabitCompletion[],
  repeatDays: number[]
): number => {
  if (!repeatDays || repeatDays.length === 0) return 0;

  const completedDates = new Set(
    completions
      .filter((c) => c.habitId === habitId)
      .map((c) => c.dateKey)
  );

  // Look back up to 90 days
  const oldestDate = new Date();
  oldestDate.setDate(oldestDate.getDate() - 90);

  let currentRunning = 0;
  let maxStreak = 0;

  const checkDate = new Date(oldestDate);
  const todayKey = getLocalDateString(new Date());

  while (checkDate <= new Date()) {
    const dateKey = getLocalDateString(checkDate);
    const dayOfWeek = checkDate.getDay();

    if (repeatDays.includes(dayOfWeek)) {
      const isCompleted = completedDates.has(dateKey);
      if (isCompleted) {
        currentRunning++;
        if (currentRunning > maxStreak) {
          maxStreak = currentRunning;
        }
      } else {
        // Today doesn't break it if it hasn't been completed yet
        if (dateKey !== todayKey) {
          currentRunning = 0;
        }
      }
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return maxStreak;
};
