import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WellnessState,
  DailyRecord,
  SleepQuality,
  Mood,
  WaterEntry,
  WaterReminderSettings,
  Habit,
  HabitCompletion,
  MoodType,
  MoodEntry,
  SleepEntry,
} from '../types';
import {
  scheduleWaterReminders,
  scheduleHabitReminder,
  cancelNotificationsByIds,
  cancelAllAppNotifications,
} from '../services/notifications/notificationService';
import { playWaterSound, playDingSound } from '../services/sound/soundService';

const getLocalDateString = (date?: Date): string => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalDateStringFromIso = (isoStr: string): string => {
  const d = new Date(isoStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createDefaultRecord = (): DailyRecord => ({
  water: 0,
  waterEntries: [],
  sleep: 0,
  sleepQuality: 2, // Medium
  mood: 0, // Unset
  moodNote: '',
  habits: [],
});

const DEFAULT_REMINDER_SETTINGS: WaterReminderSettings = {
  enabled: false,
  startTime: '09:00',
  endTime: '22:00',
  intervalMinutes: 120,
};

const generateInitialHabits = (): Habit[] => [
  {
    id: 'default-habit-1',
    name: 'Vitamin',
    emoji: '💊',
    description: 'Günlük vitaminlerini al.',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    reminderEnabled: true,
    reminderTime: '09:00',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'default-habit-2',
    name: 'Sabah Cilt Bakımı',
    emoji: '🧴',
    description: 'Cildini temizle ve nemlendir.',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    reminderEnabled: true,
    reminderTime: '08:30',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'default-habit-3',
    name: 'Yürüyüş',
    emoji: '🚶',
    description: 'Hafif tempolu yürüyüş yap.',
    repeatDays: [1, 3, 5],
    reminderEnabled: false,
    reminderTime: '18:00',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'default-habit-4',
    name: 'Kitap Oku',
    emoji: '📚',
    description: 'En az 20 sayfa kitap oku.',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    reminderEnabled: false,
    reminderTime: '21:30',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

// Helper to map MoodType -> old numeric Mood
const mapMoodTypeToNumeric = (mood: MoodType): Mood => {
  const mapping: Record<MoodType, Mood> = {
    great: 5,
    good: 4,
    neutral: 3,
    bad: 2,
    difficult: 1,
  };
  return mapping[mood];
};

// Helper to map numeric Mood -> MoodType
const mapNumericToMoodType = (val: number): MoodType => {
  if (val === 5) return 'great';
  if (val === 4) return 'good';
  if (val === 2) return 'bad';
  if (val === 1) return 'difficult';
  return 'neutral';
};

export const useWellnessStore = create<WellnessState>()(
  persist(
    (set, get) => {
      // Helper function to sync daily history record with the latest mood entry for that day
      const syncDailyMoodFromEntries = (state: WellnessState, dateKey: string) => {
        const dayEntries = state.moodEntries.filter((e: MoodEntry) => e.dateKey === dateKey);
        const currentHistory = { ...state.history };
        const dayRecord = currentHistory[dateKey]
          ? { ...currentHistory[dateKey] }
          : createDefaultRecord();

        if (dayEntries.length === 0) {
          dayRecord.mood = 0;
          dayRecord.moodNote = '';
        } else {
          // Sort by timestamp descending to get the latest
          const sorted = [...dayEntries].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          const latest = sorted[0];
          dayRecord.mood = mapMoodTypeToNumeric(latest.mood);
          dayRecord.moodNote = latest.note;
        }

        currentHistory[dateKey] = dayRecord;
        return { history: currentHistory };
      };

      // Helper function to sync daily history record with the sum of sleep entries for that day
      const syncDailySleepFromEntries = (state: WellnessState, dateKey: string) => {
        const dayEntries = state.sleepEntries.filter((e: SleepEntry) => e.dateKey === dateKey);
        const currentHistory = { ...state.history };
        const dayRecord = currentHistory[dateKey]
          ? { ...currentHistory[dateKey] }
          : createDefaultRecord();

        if (dayEntries.length === 0) {
          dayRecord.sleep = 0;
        } else {
          const totalMinutes = dayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
          dayRecord.sleep = Number((totalMinutes / 60).toFixed(2)); // Store as decimal hours
        }

        currentHistory[dateKey] = dayRecord;
        return { history: currentHistory };
      };

      return {
        username: 'Kullanıcı',
        waterTarget: 2000,
        sleepTarget: 8,
        habits: generateInitialHabits(),
        theme: 'light',
        notificationsEnabled: true,
        history: {},
        isOnboarded: false,
        wakeUpTime: '07:00',
        sleepTime: '23:00',
        
        // Water Tracker states
        waterReminderSettings: DEFAULT_REMINDER_SETTINGS,
        lastInsertedWaterEntryId: null,

        // Habit Tracker states
        habitCompletions: [],

        // Mood Tracker states
        moodEntries: [],

        // Sleep Tracker states
        sleepEntries: [],

        // Message specific states
        appUsageDays: [],
        readMessageIds: [],
        favoriteMessageIds: [],
        easterEggUnlocked: false,

        // Notification specific states
        waterReminderNotificationIds: [],
        habitReminderNotificationIds: {},

        // User Settings Actions
        setUsername: (name) => set({ username: name }),
        setWaterTarget: (target) => set({ waterTarget: target }),
        setSleepTarget: (target) => set({ sleepTarget: target }),
        setTheme: (theme) => set({ theme }),
        setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
        setWakeUpTime: (time) => set({ wakeUpTime: time }),
        setSleepTime: (time) => set({ sleepTime: time }),

        completeOnboarding: (username, waterTarget, wakeUpTime, sleepTime, notificationsEnabled) =>
          set({
            username,
            waterTarget,
            wakeUpTime,
            sleepTime,
            notificationsEnabled,
            isOnboarded: true,
          }),

        // Habit Customization Actions
        createHabit: async (habitData) => {
          const newHabit: Habit = {
            ...habitData,
            id: Math.random().toString(36).substring(2, 9) + Date.now(),
            createdAt: new Date().toISOString(),
            isActive: true,
          };
          
          let newIds: string[] = [];
          if (newHabit.reminderEnabled) {
            newIds = await scheduleHabitReminder(newHabit);
          }
          
          set((state) => ({
            habits: [...state.habits, newHabit],
            habitReminderNotificationIds: {
              ...state.habitReminderNotificationIds,
              [newHabit.id]: newIds,
            },
          }));
        },

        updateHabit: async (id, updatedFields) => {
          const existingIds = get().habitReminderNotificationIds[id] || [];
          await cancelNotificationsByIds(existingIds);

          let newHabit: Habit | undefined;
          set((state) => {
            const updatedHabits = state.habits.map((h) => {
              if (h.id === id) {
                newHabit = { ...h, ...updatedFields };
                return newHabit;
              }
              return h;
            });
            return { habits: updatedHabits };
          });

          let newIds: string[] = [];
          if (newHabit && newHabit.reminderEnabled && newHabit.isActive) {
            newIds = await scheduleHabitReminder(newHabit);
          }

          set((state) => {
            const currentIds = { ...state.habitReminderNotificationIds };
            if (newIds.length > 0) {
              currentIds[id] = newIds;
            } else {
              delete currentIds[id];
            }
            return { habitReminderNotificationIds: currentIds };
          });
        },

        archiveHabit: async (id) => {
          const existingIds = get().habitReminderNotificationIds[id] || [];
          await cancelNotificationsByIds(existingIds);

          set((state) => {
            const currentIds = { ...state.habitReminderNotificationIds };
            delete currentIds[id];

            return {
              habits: state.habits.map((h) =>
                h.id === id ? { ...h, isActive: false, archivedAt: new Date().toISOString() } : h
              ),
              habitReminderNotificationIds: currentIds,
            };
          });
        },

        deleteHabit: async (id) => {
          const existingIds = get().habitReminderNotificationIds[id] || [];
          await cancelNotificationsByIds(existingIds);

          set((state) => {
            const currentIds = { ...state.habitReminderNotificationIds };
            delete currentIds[id];

            return {
              habits: state.habits.filter((h) => h.id !== id),
              habitCompletions: state.habitCompletions.filter((c) => c.habitId !== id),
              habitReminderNotificationIds: currentIds,
            };
          });
        },

        addHabit: (habitName) => {
          get().createHabit({
            name: habitName,
            emoji: '🌱',
            description: '',
            repeatDays: [0, 1, 2, 3, 4, 5, 6],
            reminderEnabled: false,
            reminderTime: '12:00',
          });
        },

        removeHabit: (habitName) => {
          const match = get().habits.find((h) => h.name.toLowerCase() === habitName.toLowerCase());
          if (match) {
            get().deleteHabit(match.id);
          }
        },

        // Water Entry Actions
        addWater: (amount, dateStr) => {
          get().addWaterEntry(amount, dateStr);
        },

        addWaterEntry: (amount, dateStr) => {
          const targetDate = dateStr || getLocalDateString();
          const entryId = Math.random().toString(36).substring(2, 9) + Date.now();
          
          const newEntry: WaterEntry = {
            id: entryId,
            amount,
            timestamp: new Date().toISOString(),
            dateKey: targetDate,
          };

          set((state) => {
            const currentHistory = { ...state.history };
            const dayRecord = currentHistory[targetDate]
              ? { ...currentHistory[targetDate] }
              : createDefaultRecord();
            
            const entries = dayRecord.waterEntries || [];
            dayRecord.waterEntries = [...entries, newEntry];
            dayRecord.water = dayRecord.waterEntries.reduce((sum, e) => sum + e.amount, 0);
            
            currentHistory[targetDate] = dayRecord;

            return {
              history: currentHistory,
              lastInsertedWaterEntryId: entryId,
            };
          });

          playWaterSound();
          return entryId;
        },

        removeWaterEntry: (id, dateStr) => {
          const targetDate = dateStr || getLocalDateString();
          set((state) => {
            const currentHistory = { ...state.history };
            const dayRecord = currentHistory[targetDate]
              ? { ...currentHistory[targetDate] }
              : createDefaultRecord();
            
            const entries = dayRecord.waterEntries || [];
            dayRecord.waterEntries = entries.filter((e) => e.id !== id);
            dayRecord.water = dayRecord.waterEntries.reduce((sum, e) => sum + e.amount, 0);
            
            currentHistory[targetDate] = dayRecord;

            const isLastId = state.lastInsertedWaterEntryId === id;
            return {
              history: currentHistory,
              lastInsertedWaterEntryId: isLastId ? null : state.lastInsertedWaterEntryId,
            };
          });
        },

        undoLastWaterEntry: (dateStr) => {
          const lastId = get().lastInsertedWaterEntryId;
          const targetDate = dateStr || getLocalDateString();
          if (lastId) {
            get().removeWaterEntry(lastId, targetDate);
          }
        },

        updateWaterReminderSettings: async (settings) => {
          const existingIds = get().waterReminderNotificationIds || [];
          await cancelNotificationsByIds(existingIds);

          const currentSettings = get().waterReminderSettings;
          const merged = { ...currentSettings, ...settings };

          let newIds: string[] = [];
          if (merged.enabled) {
            newIds = await scheduleWaterReminders(
              merged.startTime,
              merged.endTime,
              merged.intervalMinutes
            );
          }

          set((state) => ({
            waterReminderSettings: merged,
            waterReminderNotificationIds: newIds,
          }));
        },

        // Sleep Tracking Actions
        setSleep: (hours, quality, dateStr) => {
          const targetDate = dateStr || getLocalDateString();
          
          const todayWake = new Date(targetDate);
          todayWake.setHours(7, 0, 0);
          
          const yesterdaySleep = new Date(todayWake.getTime() - hours * 3600000);
          
          get().addSleepEntry(yesterdaySleep.toISOString(), todayWake.toISOString(), 'manual');
        },

        // Mood Entry Actions
        addMoodEntry: (mood: MoodType, note: string, dateStr?: string): string => {
          const targetDate = dateStr || getLocalDateString();
          const entryId = Math.random().toString(36).substring(2, 9) + Date.now();
          
          const newEntry: MoodEntry = {
            id: entryId,
            mood,
            note,
            timestamp: new Date().toISOString(),
            dateKey: targetDate,
          };

          set((state) => {
            const updatedEntries = [...state.moodEntries, newEntry];
            const updatedState = { ...state, moodEntries: updatedEntries } as WellnessState;
            
            // Sync with history
            const historyUpdate = syncDailyMoodFromEntries(updatedState, targetDate);
            return {
              moodEntries: updatedEntries,
              ...historyUpdate,
            };
          });

          return entryId;
        },

        updateMoodEntry: (id: string, mood: MoodType, note: string): void => {
          let targetDate = '';
          set((state) => {
            const updatedEntries = state.moodEntries.map((e: MoodEntry) => {
              if (e.id === id) {
                targetDate = e.dateKey;
                return { ...e, mood, note };
              }
              return e;
            });
            const updatedState = { ...state, moodEntries: updatedEntries } as WellnessState;
            const historyUpdate = targetDate
              ? syncDailyMoodFromEntries(updatedState, targetDate)
              : {};
            
            return {
              moodEntries: updatedEntries,
              ...historyUpdate,
            };
          });
        },

        deleteMoodEntry: (id: string): void => {
          let targetDate = '';
          set((state) => {
            const match = state.moodEntries.find((e: MoodEntry) => e.id === id);
            if (match) targetDate = match.dateKey;

            const updatedEntries = state.moodEntries.filter((e: MoodEntry) => e.id !== id);
            const updatedState = { ...state, moodEntries: updatedEntries } as WellnessState;

            const historyUpdate = targetDate
              ? syncDailyMoodFromEntries(updatedState, targetDate)
              : {};

            return {
              moodEntries: updatedEntries,
              ...historyUpdate,
            };
          });
        },

        setMood: (mood: Mood, note: string, dateStr?: string) => {
          if (mood > 0) {
            const moodType = mapNumericToMoodType(mood);
            get().addMoodEntry(moodType, note, dateStr);
          } else {
            const targetDate = dateStr || getLocalDateString();
            set((state) => {
              const currentHistory = { ...state.history };
              const dayRecord = currentHistory[targetDate]
                ? { ...currentHistory[targetDate] }
                : createDefaultRecord();
              
              dayRecord.mood = 0;
              dayRecord.moodNote = '';
              currentHistory[targetDate] = dayRecord;

              const filteredEntries = state.moodEntries.filter((e: MoodEntry) => e.dateKey !== targetDate);
              return {
                history: currentHistory,
                moodEntries: filteredEntries,
              };
            });
          }
        },

        // Sleep Entries Actions
        hasSleepOverlap: (sleepTime: string, wakeTime: string, ignoreId?: string): boolean => {
          const newStart = new Date(sleepTime).getTime();
          const newEnd = new Date(wakeTime).getTime();
          
          return get().sleepEntries.some((entry) => {
            if (ignoreId && entry.id === ignoreId) return false;
            
            const existStart = new Date(entry.sleepTime).getTime();
            const existEnd = new Date(entry.wakeTime).getTime();
            
            return newStart < existEnd && newEnd > existStart;
          });
        },

        addSleepEntry: (sleepTime: string, wakeTime: string, source?: 'manual' | 'health'): string | null => {
          if (get().hasSleepOverlap(sleepTime, wakeTime)) {
            return null;
          }

          const durationMinutes = Math.round((new Date(wakeTime).getTime() - new Date(sleepTime).getTime()) / 60000);
          const dateKey = getLocalDateStringFromIso(wakeTime);
          const entryId = Math.random().toString(36).substring(2, 9) + Date.now();

          const newEntry: SleepEntry = {
            id: entryId,
            sleepTime,
            wakeTime,
            durationMinutes,
            dateKey,
            createdAt: new Date().toISOString(),
            source: source || 'manual',
          };

          set((state) => {
            const updatedEntries = [...state.sleepEntries, newEntry];
            const updatedState = { ...state, sleepEntries: updatedEntries } as WellnessState;
            
            // Sync sleep values to history daily record
            const historyUpdate = syncDailySleepFromEntries(updatedState, dateKey);

            return {
              sleepEntries: updatedEntries,
              ...historyUpdate,
            };
          });

          return entryId;
        },

        updateSleepEntry: (id: string, sleepTime: string, wakeTime: string): boolean => {
          if (get().hasSleepOverlap(sleepTime, wakeTime, id)) {
            return false;
          }

          const durationMinutes = Math.round((new Date(wakeTime).getTime() - new Date(sleepTime).getTime()) / 60000);
          const newDateKey = getLocalDateStringFromIso(wakeTime);
          let oldDateKey = '';

          set((state) => {
            const match = state.sleepEntries.find((e: SleepEntry) => e.id === id);
            if (match) oldDateKey = match.dateKey;

            const updatedEntries = state.sleepEntries.map((e: SleepEntry) => {
              if (e.id === id) {
                return {
                  ...e,
                  sleepTime,
                  wakeTime,
                  durationMinutes,
                  dateKey: newDateKey,
                };
              }
              return e;
            });

            let updatedState = { ...state, sleepEntries: updatedEntries } as WellnessState;
            
            // Sync new date
            let historyUpdate = syncDailySleepFromEntries(updatedState, newDateKey);
            updatedState = { ...updatedState, ...historyUpdate };

            // Sync old date if changed
            if (oldDateKey && oldDateKey !== newDateKey) {
              const oldHistoryUpdate = syncDailySleepFromEntries(updatedState, oldDateKey);
              updatedState = { ...updatedState, ...oldHistoryUpdate };
            }

            return updatedState;
          });

          return true;
        },

        deleteSleepEntry: (id: string): void => {
          let targetDate = '';
          set((state) => {
            const match = state.sleepEntries.find((e: SleepEntry) => e.id === id);
            if (match) targetDate = match.dateKey;

            const updatedEntries = state.sleepEntries.filter((e: SleepEntry) => e.id !== id);
            const updatedState = { ...state, sleepEntries: updatedEntries } as WellnessState;

            const historyUpdate = targetDate
              ? syncDailySleepFromEntries(updatedState, targetDate)
              : {};

            return {
              sleepEntries: updatedEntries,
              ...historyUpdate,
            };
          });
        },

        // Special Messages Actions
        trackAppOpen: (dateStr?: string): void => {
          const targetKey = dateStr || getLocalDateString();
          if (!get().appUsageDays.includes(targetKey)) {
            set((state) => ({
              appUsageDays: [...state.appUsageDays, targetKey],
            }));
          }
        },

        markMessageAsRead: (id: string): void => {
          if (!get().readMessageIds.includes(id)) {
            set((state) => ({
              readMessageIds: [...state.readMessageIds, id],
            }));
          }
        },

        toggleFavoriteMessage: (id: string): void => {
          set((state) => {
            const isFav = state.favoriteMessageIds.includes(id);
            const newList = isFav
              ? state.favoriteMessageIds.filter((fid) => fid !== id)
              : [...state.favoriteMessageIds, id];
            return { favoriteMessageIds: newList };
          });
        },

        unlockEasterEgg: (): void => {
          if (!get().easterEggUnlocked) {
            set({ easterEggUnlocked: true });
          }
        },

        // Habit Completion Toggle Actions
        toggleHabitCompletion: (habitId, dateStr) => {
          const targetDate = dateStr || getLocalDateString();
          let becameCompleted = false;

          set((state) => {
            const existingIndex = state.habitCompletions.findIndex(
              (c) => c.habitId === habitId && c.dateKey === targetDate
            );

            let newCompletions = [...state.habitCompletions];

            if (existingIndex > -1) {
              newCompletions = newCompletions.filter((_, i) => i !== existingIndex);
            } else {
              const newCompletion: HabitCompletion = {
                id: Math.random().toString(36).substring(2, 9) + Date.now(),
                habitId,
                dateKey: targetDate,
                completedAt: new Date().toISOString(),
              };
              newCompletions.push(newCompletion);
              becameCompleted = true;
            }

            return { habitCompletions: newCompletions };
          });

          if (becameCompleted) {
            playDingSound();
          }
        },

        // Reset Data
        resetAllData: () => {
          cancelAllAppNotifications();
          set({
            username: 'Kullanıcı',
            waterTarget: 2000,
            sleepTarget: 8,
            habits: generateInitialHabits(),
            theme: 'light',
            notificationsEnabled: true,
            history: {},
            isOnboarded: false,
            wakeUpTime: '07:00',
            sleepTime: '23:00',
            waterReminderSettings: DEFAULT_REMINDER_SETTINGS,
            lastInsertedWaterEntryId: null,
            habitCompletions: [],
            moodEntries: [],
            sleepEntries: [],
            appUsageDays: [],
            readMessageIds: [],
            favoriteMessageIds: [],
            easterEggUnlocked: false,
            waterReminderNotificationIds: [],
            habitReminderNotificationIds: {},
          });
        },
      };
    },
    {
      name: 'mysun-wellness-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Migration: If storage contains legacy habits, convert
        if (
          persistedState &&
          Array.isArray(persistedState.habits) &&
          persistedState.habits.length > 0
        ) {
          const firstItem = persistedState.habits[0];
          if (typeof firstItem === 'string') {
            persistedState.habits = generateInitialHabits();
            persistedState.habitCompletions = [];
          }
        }
        return persistedState;
      },
    }
  )
);
