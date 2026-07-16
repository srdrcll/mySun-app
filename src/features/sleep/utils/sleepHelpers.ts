import { SleepEntry } from '../../../types';
import { getLocalDateString } from '../../../utils/date';

// Formats duration to e.g. "7 sa 45 dk" or "8 saat" or "45 dk"
export const formatSleepDuration = (minutes: number): string => {
  if (minutes <= 0) return '0 dk';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs} sa ${mins} dk`;
  } else if (hrs > 0) {
    return `${hrs} saat`;
  } else {
    return `${mins} dk`;
  }
};

// Formats duration to full text, e.g. "7 saat 45 dakika"
export const formatSleepDurationFull = (minutes: number): string => {
  if (minutes <= 0) return '0 dakika';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs} saat ${mins} dakika`;
  } else if (hrs > 0) {
    return `${hrs} saat`;
  } else {
    return `${mins} dakika`;
  }
};

// Calculates average sleep duration in minutes, only considering days that have entries
export const calculateAverageSleep = (entries: SleepEntry[], daysCount: number = 7): number => {
  if (!entries || entries.length === 0) return 0;
  
  const today = new Date();
  let activeDays = 0;
  let totalMinutes = 0;

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = getLocalDateString(d);

    const dayEntries = entries.filter((e) => e.dateKey === dateKey);
    const dayTotal = dayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
    
    if (dayTotal > 0) {
      totalMinutes += dayTotal;
      activeDays++;
    }
  }

  return activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;
};
