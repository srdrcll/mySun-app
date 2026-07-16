import { WellnessState, WaterEntry, MoodEntry, SleepEntry, Habit } from '../../../types';

// Check if there is any logged wellness data for a given dateKey (YYYY-MM-DD)
export const hasDataForDate = (dateKey: string, state: WellnessState): boolean => {
  // Water check
  const waterRecord = state.history[dateKey];
  const hasWater =
    (waterRecord?.waterEntries && waterRecord.waterEntries.length > 0) ||
    (waterRecord?.water && waterRecord.water > 0);

  // Habits check
  const hasHabits = state.habitCompletions.some((c) => c.dateKey === dateKey);

  // Mood check
  const hasMood = state.moodEntries.some((e) => e.dateKey === dateKey);

  // Sleep check
  const hasSleep = state.sleepEntries.some((e) => e.dateKey === dateKey);

  return !!(hasWater || hasHabits || hasMood || hasSleep);
};

export interface DaySummaryData {
  waterAmount: number;
  waterTarget: number;
  waterEntries: WaterEntry[];
  habitsCompleted: number;
  habitsPlanned: number;
  habitsList: { id: string; name: string; emoji: string; completed: boolean }[];
  latestMood: MoodEntry | undefined;
  moodEntries: MoodEntry[];
  sleepMinutes: number;
  sleepEntries: SleepEntry[];
  hasAnyData: boolean;
}

// Calculate the summary details for a specific day key YYYY-MM-DD
export const getDaySummary = (dateKey: string, state: WellnessState): DaySummaryData => {
  // 1. Water
  const waterRecord = state.history[dateKey];
  const waterEntries = waterRecord?.waterEntries || [];
  const legacyWater = waterRecord?.water || 0;
  const waterAmount = waterEntries.length > 0
    ? waterEntries.reduce((sum, e) => sum + e.amount, 0)
    : legacyWater;

  // 2. Habits (taking into account creation date and archive date)
  const d = new Date(dateKey);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday

  const activeOnDateHabits = state.habits.filter((h) => {
    const createdDate = h.createdAt.split('T')[0];
    if (createdDate > dateKey) return false;

    if (!h.isActive && h.archivedAt) {
      const archivedDate = h.archivedAt.split('T')[0];
      if (archivedDate < dateKey) return false;
    }
    return true;
  });

  const plannedHabits = activeOnDateHabits.filter((h) => h.repeatDays.includes(dayOfWeek));
  
  const completedIds = new Set(
    state.habitCompletions.filter((c) => c.dateKey === dateKey).map((c) => c.habitId)
  );

  const habitsList = plannedHabits.map((h) => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    completed: completedIds.has(h.id),
  }));

  const habitsCompleted = habitsList.filter((h) => h.completed).length;
  const habitsPlanned = habitsList.length;

  // 3. Mood
  const moodEntries = state.moodEntries
    .filter((e) => e.dateKey === dateKey)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // oldest to newest (chronological)

  const latestMood = moodEntries.length > 0 ? moodEntries[moodEntries.length - 1] : undefined;

  // 4. Sleep
  const sleepEntries = state.sleepEntries.filter((e) => e.dateKey === dateKey);
  const sleepMinutes = sleepEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

  const hasAnyData = hasDataForDate(dateKey, state);

  return {
    waterAmount,
    waterTarget: state.waterTarget,
    waterEntries,
    habitsCompleted,
    habitsPlanned,
    habitsList,
    latestMood,
    moodEntries,
    sleepMinutes,
    sleepEntries,
    hasAnyData,
  };
};

export interface MonthSummaryData {
  waterDaysCount: number;
  habitCompletionsCount: number;
  moodEntriesCount: number;
  sleepDaysCount: number;
}

// Calculate monthly totals (year is YYYY, month is 1-indexed: 1 = Jan, 12 = Dec)
export const getMonthSummary = (
  year: number,
  month: number,
  state: WellnessState
): MonthSummaryData => {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  // 1. Water days count (unique dateKeys with water > 0)
  const waterKeys = new Set<string>();
  Object.keys(state.history).forEach((dk) => {
    if (dk.startsWith(prefix)) {
      const rec = state.history[dk];
      const hasWater =
        (rec?.waterEntries && rec.waterEntries.length > 0) ||
        (rec?.water && rec.water > 0);
      if (hasWater) {
        waterKeys.add(dk);
      }
    }
  });
  const waterDaysCount = waterKeys.size;

  // 2. Habit completions in that month
  const habitCompletionsCount = state.habitCompletions.filter((c) =>
    c.dateKey.startsWith(prefix)
  ).length;

  // 3. Mood entries count in that month
  const moodEntriesCount = state.moodEntries.filter((e) =>
    e.dateKey.startsWith(prefix)
  ).length;

  // 4. Sleep days count (unique dateKeys with sleep entries)
  const sleepKeys = new Set<string>();
  state.sleepEntries.forEach((e) => {
    if (e.dateKey.startsWith(prefix)) {
      sleepKeys.add(e.dateKey);
    }
  });
  const sleepDaysCount = sleepKeys.size;

  return {
    waterDaysCount,
    habitCompletionsCount,
    moodEntriesCount,
    sleepDaysCount,
  };
};
