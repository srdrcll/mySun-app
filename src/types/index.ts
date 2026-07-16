export type Mood = 0 | 1 | 2 | 3 | 4 | 5;

export type SleepQuality = 1 | 2 | 3; // 1: Bad, 2: Medium, 3: Good

export type MoodType = 'great' | 'good' | 'neutral' | 'bad' | 'difficult';

export type SpecialMessageType = 'daily' | 'scheduled' | 'surprise' | 'milestone';

export interface WaterEntry {
  id: string;
  amount: number;
  timestamp: string; // ISO String
  dateKey: string; // YYYY-MM-DD
}

export interface WaterReminderSettings {
  enabled: boolean;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  intervalMinutes: number;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  description: string;
  repeatDays: number[]; // Array of weekdays 0 (Sunday) to 6 (Saturday)
  reminderEnabled: boolean;
  reminderTime: string; // HH:MM
  createdAt: string; // ISO String
  isActive: boolean; // false if archived
  archivedAt?: string; // ISO String when archived
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  dateKey: string; // YYYY-MM-DD
  completedAt: string; // ISO String
}

export interface MoodEntry {
  id: string;
  mood: MoodType;
  note: string;
  timestamp: string; // ISO String
  dateKey: string; // YYYY-MM-DD
}

export interface SleepEntry {
  id: string;
  sleepTime: string; // ISO String
  wakeTime: string; // ISO String
  durationMinutes: number;
  dateKey: string; // YYYY-MM-DD
  createdAt: string; // ISO String
  source: 'manual' | 'health';
}

export interface UnlockCondition {
  type: 'habit_completions' | 'water_goal_days' | 'app_days';
  value: number;
}

export interface SpecialMessage {
  id: string;
  title: string;
  content: string;
  type: SpecialMessageType;
  author: string;
  scheduledDate: string | null; // YYYY-MM-DD for scheduled type
  unlockCondition: UnlockCondition | null; // for surprise/milestone types
  createdAt: string; // ISO String
  isActive: boolean;
  showUnlockHint?: boolean;
}

export interface DailyRecord {
  water: number; // Stored total for backwards compatibility
  waterEntries?: WaterEntry[]; // Optional to support old storage migrations
  sleep: number;
  sleepQuality: SleepQuality;
  mood: Mood;
  moodNote: string;
  habits: string[]; // List of completed habit names (kept for backwards compatibility)
}

export type HistoryData = Record<string, DailyRecord>;

export interface UserPreferences {
  username: string;
  waterTarget: number;
  sleepTarget: number;
  habits: Habit[]; // Updated to rich Habit objects
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  isOnboarded: boolean;
  wakeUpTime: string;
  sleepTime: string;
}

export interface WellnessState {
  username: string;
  waterTarget: number;
  sleepTarget: number;
  habits: Habit[]; // Updated to rich Habit objects
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  history: HistoryData;
  isOnboarded: boolean;
  wakeUpTime: string;
  sleepTime: string;
  
  // Water specific states
  waterReminderSettings: WaterReminderSettings;
  lastInsertedWaterEntryId: string | null;
  
  // Habit specific states
  habitCompletions: HabitCompletion[];
  
  // Mood specific states
  moodEntries: MoodEntry[];
  
  // Sleep Tracker states
  primarySleepEntryId?: string; // Optional helper
  sleepEntries: SleepEntry[];

  // Message specific states (persist user interactions)
  appUsageDays: string[]; // List of unique dateKeys opened
  readMessageIds: string[];
  favoriteMessageIds: string[];
  easterEggUnlocked: boolean;

  // Notification specific states
  waterReminderNotificationIds: string[];
  habitReminderNotificationIds: Record<string, string[]>;
  
  // Actions
  setUsername: (name: string) => void;
  setWaterTarget: (target: number) => void;
  setSleepTarget: (target: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setWakeUpTime: (time: string) => void;
  setSleepTime: (time: string) => void;
  
  completeOnboarding: (
    username: string,
    waterTarget: number,
    wakeUpTime: string,
    sleepTime: string,
    notificationsEnabled: boolean
  ) => void;
  
  // Habit management Actions
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'isActive'>) => void;
  updateHabit: (id: string, updatedFields: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  archiveHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  addHabit: (habitName: string) => void; // Keep for backward compatibility
  removeHabit: (habitName: string) => void; // Keep for backward compatibility
  
  // Daily Tracking Actions
  addWater: (amount: number, dateStr?: string) => void;
  addWaterEntry: (amount: number, dateStr?: string) => string;
  removeWaterEntry: (id: string, dateStr?: string) => void;
  undoLastWaterEntry: (dateStr?: string) => void;
  updateWaterReminderSettings: (settings: Partial<WaterReminderSettings>) => void;
  
  setSleep: (hours: number, quality: SleepQuality, dateStr?: string) => void;
  setMood: (mood: Mood, note: string, dateStr?: string) => void;
  
  // Mood management Actions
  addMoodEntry: (mood: MoodType, note: string, dateStr?: string) => string;
  updateMoodEntry: (id: string, mood: MoodType, note: string) => void;
  deleteMoodEntry: (id: string) => void;
  
  // Sleep management Actions
  addSleepEntry: (sleepTime: string, wakeTime: string, source?: 'manual' | 'health') => string | null;
  updateSleepEntry: (id: string, sleepTime: string, wakeTime: string) => boolean;
  deleteSleepEntry: (id: string) => void;
  hasSleepOverlap: (sleepTime: string, wakeTime: string, ignoreId?: string) => boolean;

  // Special Messages Actions
  trackAppOpen: (dateStr?: string) => void;
  markMessageAsRead: (id: string) => void;
  toggleFavoriteMessage: (id: string) => void;
  unlockEasterEgg: () => void;
  
  toggleHabitCompletion: (habitId: string, dateStr?: string) => void;
  
  // Reset Data
  resetAllData: () => void;

  // Supabase Auth and Sync State
  session: any | null;
  authLoading: boolean;
  authError: string | null;
  lastSyncedAt: string | null;

  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => void;
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
}
