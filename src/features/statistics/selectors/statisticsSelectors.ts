import {
  WaterEntry,
  Habit,
  HabitCompletion,
  MoodEntry,
  SleepEntry,
  MoodType,
} from '../../../types';
import { getLocalDateString, getFormattedDisplayDate, getPastDaysList, WEEKDAYS } from '../../../utils/date';

const getLocalDateStringFromIso = (isoStr: string): string => {
  try {
    const d = new Date(isoStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

export interface ChartDataItem {
  label: string;
  value: number; // For rendering height
  secondaryLabel?: string; // For text overlay (e.g. "4/5" or "8 sa")
  rawDate?: string;
  isEmpty?: boolean;
}

// 1. Water Statistics Selector
export interface WaterStats {
  dailyAverage: number; // ml
  targetMetDays: number;
  totalDays: number;
  totalVolume: number; // ml
  chartData: ChartDataItem[];
}

export const getWaterStatistics = (
  entries: WaterEntry[],
  range: string[],
  currentTarget: number
): WaterStats => {
  let totalVolume = 0;
  let targetMetDays = 0;
  
  // Calculate daily values for range
  const dailyValues: Record<string, number> = {};
  range.forEach((dateKey) => {
    dailyValues[dateKey] = 0;
  });

  entries.forEach((e) => {
    if (dailyValues[e.dateKey] !== undefined) {
      dailyValues[e.dateKey] += e.amount;
    }
  });

  // Calculate stats
  range.forEach((dateKey) => {
    const amount = dailyValues[dateKey];
    totalVolume += amount;
    if (amount >= currentTarget) {
      targetMetDays++;
    }
  });

  const dailyAverage = range.length > 0 ? Math.round(totalVolume / range.length) : 0;

  // Build Chart Data
  let chartData: ChartDataItem[] = [];
  if (range.length === 7) {
    // 7 Days: Show daily
    chartData = range.map((dateKey) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayLabel = WEEKDAYS[dateObj.getDay()].substring(0, 3); // "Pzt", "Sal" etc
      const val = dailyValues[dateKey];
      return {
        label: dayLabel,
        value: val,
        secondaryLabel: val > 0 ? `${val} ml` : '0',
        rawDate: dateKey,
      };
    });
  } else if (range.length === 30) {
    // 30 Days: daily thin bars
    chartData = range.map((dateKey) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      const val = dailyValues[dateKey];
      return {
        label: `${d}`,
        value: val,
        secondaryLabel: val > 0 ? `${val} ml` : '0',
        rawDate: dateKey,
      };
    });
  } else {
    // 90 Days: Group into weeks (13 weeks)
    const reversedRange = [...range].reverse(); // oldest to newest
    const chunks = [];
    const chunkSize = 7;
    for (let i = 0; i < reversedRange.length; i += chunkSize) {
      chunks.push(reversedRange.slice(i, i + chunkSize));
    }
    
    // Reverse back chunks list so it renders chronologically (past to today)
    chunks.reverse();

    chartData = chunks.map((chunk, index) => {
      let chunkTotal = 0;
      chunk.forEach((dk) => {
        chunkTotal += dailyValues[dk] || 0;
      });
      const chunkAvg = Math.round(chunkTotal / chunk.length);
      return {
        label: `H${index + 1}`,
        value: chunkAvg,
        secondaryLabel: chunkAvg > 0 ? `${chunkAvg} ml` : '0',
      };
    });
  }

  return {
    dailyAverage,
    targetMetDays,
    totalDays: range.length,
    totalVolume,
    chartData,
  };
};

// 2. Habit Statistics Selector
export interface HabitStats {
  totalPlanned: number;
  totalCompleted: number;
  completionRate: number; // percentage (0 - 100)
  mostRegular: { emoji: string; name: string; rate: number }[];
  chartData: ChartDataItem[];
}

export const getHabitStatistics = (
  habits: Habit[],
  completions: HabitCompletion[],
  range: string[]
): HabitStats => {
  let totalPlanned = 0;
  let totalCompleted = 0;

  // Track planned vs completed count per habit
  const habitStatsMap: Record<string, { planned: number; completed: number }> = {};
  habits.forEach((h) => {
    habitStatsMap[h.id] = { planned: 0, completed: 0 };
  });

  // For each day in the range, calculate what was planned and completed
  const dailyPlannedCount: Record<string, number> = {};
  const dailyCompletedCount: Record<string, number> = {};
  
  range.forEach((dateKey) => {
    dailyPlannedCount[dateKey] = 0;
    dailyCompletedCount[dateKey] = 0;

    const [y, m, d] = dateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();

    habits.forEach((h) => {
      // Check if habit was active on dateKey
      const createdDateKey = getLocalDateStringFromIso(h.createdAt);
      const isCreated = createdDateKey ? createdDateKey <= dateKey : true;

      let isArchived = false;
      if (!h.isActive && h.archivedAt) {
        const archivedDateKey = getLocalDateStringFromIso(h.archivedAt);
        if (archivedDateKey && archivedDateKey <= dateKey) {
          isArchived = true;
        }
      }

      if (isCreated && !isArchived && h.repeatDays.includes(dayOfWeek)) {
        totalPlanned++;
        dailyPlannedCount[dateKey]++;
        if (habitStatsMap[h.id]) {
          habitStatsMap[h.id].planned++;
        }
      }
    });

    // Count completions for this day
    const dayCompletions = completions.filter((c) => c.dateKey === dateKey);
    dayCompletions.forEach((c) => {
      const h = habits.find((hab) => hab.id === c.habitId);
      if (h) {
        // Double check if habit was planned on this day to avoid >100% rates
        const createdDateKey = getLocalDateStringFromIso(h.createdAt);
        const isCreated = createdDateKey ? createdDateKey <= dateKey : true;
        let isArchived = false;
        if (!h.isActive && h.archivedAt) {
          const archivedDateKey = getLocalDateStringFromIso(h.archivedAt);
          if (archivedDateKey && archivedDateKey <= dateKey) {
            isArchived = true;
          }
        }

        if (isCreated && !isArchived && h.repeatDays.includes(dayOfWeek)) {
          totalCompleted++;
          dailyCompletedCount[dateKey]++;
          if (habitStatsMap[h.id]) {
            habitStatsMap[h.id].completed++;
          }
        }
      }
    });
  });

  const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  // Calculate most regular habits
  const mostRegular = habits
    .map((h) => {
      const stats = habitStatsMap[h.id] || { planned: 0, completed: 0 };
      const rate = stats.planned > 0 ? Math.round((stats.completed / stats.planned) * 100) : 0;
      return {
        emoji: h.emoji,
        name: h.name,
        rate,
        planned: stats.planned,
      };
    })
    .filter((h) => h.planned > 0) // only include if planned at least once in range
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  // Build Chart Data
  let chartData: ChartDataItem[] = [];
  if (range.length === 7) {
    chartData = range.map((dateKey) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayLabel = WEEKDAYS[dateObj.getDay()].substring(0, 3);
      
      const planned = dailyPlannedCount[dateKey] || 0;
      const completed = dailyCompletedCount[dateKey] || 0;
      const pct = planned > 0 ? Math.round((completed / planned) * 100) : 0;

      return {
        label: dayLabel,
        value: pct,
        secondaryLabel: planned > 0 ? `${completed}/${planned}` : '—',
        isEmpty: planned === 0,
        rawDate: dateKey,
      };
    });
  } else if (range.length === 30) {
    chartData = range.map((dateKey) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      const planned = dailyPlannedCount[dateKey] || 0;
      const completed = dailyCompletedCount[dateKey] || 0;
      const pct = planned > 0 ? Math.round((completed / planned) * 100) : 0;

      return {
        label: `${d}`,
        value: pct,
        secondaryLabel: planned > 0 ? `${completed}/${planned}` : '—',
        isEmpty: planned === 0,
        rawDate: dateKey,
      };
    });
  } else {
    // 90 Days: Group into weeks
    const reversedRange = [...range].reverse();
    const chunks = [];
    const chunkSize = 7;
    for (let i = 0; i < reversedRange.length; i += chunkSize) {
      chunks.push(reversedRange.slice(i, i + chunkSize));
    }
    chunks.reverse();

    chartData = chunks.map((chunk, index) => {
      let chunkPlanned = 0;
      let chunkCompleted = 0;
      chunk.forEach((dk) => {
        chunkPlanned += dailyPlannedCount[dk] || 0;
        chunkCompleted += dailyCompletedCount[dk] || 0;
      });
      const pct = chunkPlanned > 0 ? Math.round((chunkCompleted / chunkPlanned) * 100) : 0;
      return {
        label: `H${index + 1}`,
        value: pct,
        secondaryLabel: chunkPlanned > 0 ? `${pct}%` : '—',
        isEmpty: chunkPlanned === 0,
      };
    });
  }

  return {
    totalPlanned,
    totalCompleted,
    completionRate,
    mostRegular,
    chartData,
  };
};

// 3. Mood Statistics Selector
export interface MoodStats {
  mostFrequent: MoodType | null;
  distribution: Record<MoodType, number>;
  chartData: ChartDataItem[];
}

export const getMoodStatistics = (
  entries: MoodEntry[],
  range: string[]
): MoodStats => {
  const distribution: Record<MoodType, number> = {
    great: 0,
    good: 0,
    neutral: 0,
    bad: 0,
    difficult: 0,
  };

  // Find daily values (latest entry of each day)
  const dailyMoods: Record<string, MoodType | undefined> = {};
  range.forEach((dateKey) => {
    dailyMoods[dateKey] = undefined;
    const dayEntries = entries.filter((e) => e.dateKey === dateKey);
    if (dayEntries.length > 0) {
      const sorted = [...dayEntries].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const latest = sorted[0].mood;
      dailyMoods[dateKey] = latest;
      distribution[latest]++;
    }
  });

  // Calculate most frequent
  let mostFrequent: MoodType | null = null;
  let maxCount = -1;
  (Object.keys(distribution) as MoodType[]).forEach((key) => {
    if (distribution[key] > maxCount && distribution[key] > 0) {
      maxCount = distribution[key];
      mostFrequent = key;
    }
  });

  // Numerical mapping for chart heights
  const moodNumericMap: Record<MoodType, number> = {
    great: 5,
    good: 4,
    neutral: 3,
    bad: 2,
    difficult: 1,
  };

  const moodEmojiMap: Record<MoodType, string> = {
    great: '😄',
    good: '🙂',
    neutral: '😐',
    bad: '😔',
    difficult: '😣',
  };

  // Build Chart Data
  let chartData: ChartDataItem[] = [];
  if (range.length === 7) {
    chartData = range.map((dateKey) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayLabel = WEEKDAYS[dateObj.getDay()].substring(0, 3);
      
      const mood = dailyMoods[dateKey];
      return {
        label: dayLabel,
        value: mood ? moodNumericMap[mood] : 0, // scale 1-5
        secondaryLabel: mood ? moodEmojiMap[mood] : '—',
        isEmpty: !mood,
        rawDate: dateKey,
      };
    });
  } else if (range.length === 30) {
    chartData = range.map((dateKey) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      const mood = dailyMoods[dateKey];
      return {
        label: `${d}`,
        value: mood ? moodNumericMap[mood] : 0,
        secondaryLabel: mood ? moodEmojiMap[mood] : '—',
        isEmpty: !mood,
        rawDate: dateKey,
      };
    });
  } else {
    // 90 Days: Group weekly (Mode of mood within week chunk)
    const reversedRange = [...range].reverse();
    const chunks = [];
    const chunkSize = 7;
    for (let i = 0; i < reversedRange.length; i += chunkSize) {
      chunks.push(reversedRange.slice(i, i + chunkSize));
    }
    chunks.reverse();

    chartData = chunks.map((chunk, index) => {
      const chunkDist: Record<MoodType, number> = {
        great: 0,
        good: 0,
        neutral: 0,
        bad: 0,
        difficult: 0,
      };
      let loggedCount = 0;
      chunk.forEach((dk) => {
        const mood = dailyMoods[dk];
        if (mood) {
          chunkDist[mood]++;
          loggedCount++;
        }
      });

      let chunkMode: MoodType | null = null;
      let maxCountLocal = -1;
      (Object.keys(chunkDist) as MoodType[]).forEach((key) => {
        if (chunkDist[key] > maxCountLocal && chunkDist[key] > 0) {
          maxCountLocal = chunkDist[key];
          chunkMode = key;
        }
      });

      return {
        label: `H${index + 1}`,
        value: chunkMode ? moodNumericMap[chunkMode] : 0,
        secondaryLabel: chunkMode ? moodEmojiMap[chunkMode] : '—',
        isEmpty: !chunkMode,
      };
    });
  }

  return {
    mostFrequent,
    distribution,
    chartData,
  };
};

// 4. Sleep Statistics Selector
export interface SleepStats {
  averageMinutes: number;
  totalMinutes: number;
  longestLogMinutes: number;
  chartData: ChartDataItem[];
}

export const getSleepStatistics = (
  entries: SleepEntry[],
  range: string[]
): SleepStats => {
  let totalMinutes = 0;
  let longestLogMinutes = 0;
  let activeDays = 0;

  const dailyValues: Record<string, number> = {};
  range.forEach((dateKey) => {
    dailyValues[dateKey] = 0;
  });

  entries.forEach((e) => {
    if (dailyValues[e.dateKey] !== undefined) {
      dailyValues[e.dateKey] += e.durationMinutes;
    }
    // Track longest single log (must fall within range)
    if (range.includes(e.dateKey)) {
      if (e.durationMinutes > longestLogMinutes) {
        longestLogMinutes = e.durationMinutes;
      }
    }
  });

  range.forEach((dateKey) => {
    const mins = dailyValues[dateKey];
    if (mins > 0) {
      totalMinutes += mins;
      activeDays++;
    }
  });

  // Calculate average ONLY based on days with entries
  const averageMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

  // Build Chart Data
  let chartData: ChartDataItem[] = [];
  const formatMinsToShortLabel = (mins: number) => {
    if (mins <= 0) return '0';
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs > 0 && m > 0) return `${hrs}sa\n${m}dk`;
    if (hrs > 0) return `${hrs}sa`;
    return `${m}dk`;
  };

  if (range.length === 7) {
    chartData = range.map((dateKey) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayLabel = WEEKDAYS[dateObj.getDay()].substring(0, 3);
      
      const mins = dailyValues[dateKey];
      return {
        label: dayLabel,
        value: mins, // in minutes
        secondaryLabel: mins > 0 ? formatMinsToShortLabel(mins) : '—',
        isEmpty: mins === 0,
        rawDate: dateKey,
      };
    });
  } else if (range.length === 30) {
    chartData = range.map((dateKey) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      const mins = dailyValues[dateKey];
      return {
        label: `${d}`,
        value: mins,
        secondaryLabel: mins > 0 ? `${Math.round(mins / 60)}s` : '—',
        isEmpty: mins === 0,
        rawDate: dateKey,
      };
    });
  } else {
    // 90 Days: Group into weeks
    const reversedRange = [...range].reverse();
    const chunks = [];
    const chunkSize = 7;
    for (let i = 0; i < reversedRange.length; i += chunkSize) {
      chunks.push(reversedRange.slice(i, i + chunkSize));
    }
    chunks.reverse();

    chartData = chunks.map((chunk, index) => {
      let chunkTotal = 0;
      let chunkActiveDays = 0;
      chunk.forEach((dk) => {
        const mins = dailyValues[dk] || 0;
        if (mins > 0) {
          chunkTotal += mins;
          chunkActiveDays++;
        }
      });
      const avg = chunkActiveDays > 0 ? Math.round(chunkTotal / chunkActiveDays) : 0;
      return {
        label: `H${index + 1}`,
        value: avg,
        secondaryLabel: avg > 0 ? `${Math.round(avg / 60)}s` : '—',
        isEmpty: avg === 0,
      };
    });
  }

  return {
    averageMinutes,
    totalMinutes,
    longestLogMinutes,
    chartData,
  };
};

// 5. Period Summary Generator
export interface PeriodSummary {
  waterLiters: number;
  completedHabitsCount: number;
  moodCount: number;
  sleepHours: number;
}

export const getPeriodSummary = (
  waterStats: WaterStats,
  habitStats: HabitStats,
  moodStats: MoodStats,
  sleepStats: SleepStats
): PeriodSummary => {
  return {
    waterLiters: Number((waterStats.totalVolume / 1000).toFixed(1)),
    completedHabitsCount: habitStats.totalCompleted,
    moodCount: Object.values(moodStats.distribution).reduce((a, b) => a + b, 0),
    sleepHours: Number((sleepStats.totalMinutes / 60).toFixed(1)),
  };
};
