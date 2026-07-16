import { SpecialMessage } from '../../../types';
import { STATIC_SPECIAL_MESSAGES } from '../data/messages';

// Deterministic cyclic selector for daily messages based on dateKey
export const getDailyMessage = (dateKey: string): SpecialMessage => {
  const dailies = STATIC_SPECIAL_MESSAGES.filter((m) => m.type === 'daily' && m.isActive);
  if (dailies.length === 0) {
    // Fallback in case list is empty
    return {
      id: 'daily-fallback',
      title: 'Küçük Bir Not',
      content: 'Kendine karşı biraz daha nazik ol bugün {name}.',
      type: 'daily',
      author: 'Serdar',
      scheduledDate: null,
      unlockCondition: null,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
  }

  // Calculate hash based on characters in YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash += dateKey.charCodeAt(i);
  }
  
  const index = hash % dailies.length;
  return dailies[index];
};

// Replaces template tags (e.g. {name}) with actual profile values
export const replacePlaceholders = (content: string, name: string): string => {
  if (!content) return '';
  const sanitizedName = name || 'Kullanıcı';
  return content.replace(/{name}/g, sanitizedName);
};

export interface UnlockVerificationData {
  appDays: number;
  waterGoalDays: number;
  habitCompletions: number;
  todayDateKey: string;
}

// Verifies if a message meets its unlock criteria
export const isMessageUnlocked = (
  message: SpecialMessage,
  data: UnlockVerificationData
): boolean => {
  if (!message.isActive) return false;

  // Daily messages are always unlocked
  if (message.type === 'daily') return true;

  // Scheduled date unlocks
  if (message.type === 'scheduled') {
    if (!message.scheduledDate) return true;
    // Compare YYYY-MM-DD strings lexicographically
    return data.todayDateKey >= message.scheduledDate;
  }

  // Surprise and milestone unlocks
  if (message.type === 'surprise' || message.type === 'milestone') {
    const cond = message.unlockCondition;
    if (!cond) return true;

    if (cond.type === 'app_days') {
      return data.appDays >= cond.value;
    }
    if (cond.type === 'water_goal_days') {
      return data.waterGoalDays >= cond.value;
    }
    if (cond.type === 'habit_completions') {
      return data.habitCompletions >= cond.value;
    }
  }

  return false;
};

// Builds a display-friendly explanation of the unlock criteria
export const getUnlockHint = (message: SpecialMessage): string => {
  if (message.type === 'scheduled' && message.scheduledDate) {
    const [y, m, d] = message.scheduledDate.split('-').map(Number);
    // Render e.g. "15 Ağustos'ta açılacak"
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${d} ${monthNames[m - 1]} tarihinde açılacak.`;
  }

  const cond = message.unlockCondition;
  if (cond) {
    if (cond.type === 'app_days') {
      return `${cond.value} gün uygulamayı ziyaret ettiğinde açılacak.`;
    }
    if (cond.type === 'water_goal_days') {
      return `${cond.value} gün su hedefine ulaştığında açılacak.`;
    }
    if (cond.type === 'habit_completions') {
      return `${cond.value} alışkanlık tamamladığında açılacak.`;
    }
  }

  return 'Zamanı gelince açılacak.';
};
