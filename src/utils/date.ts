export const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const WEEKDAYS = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
];

// Returns YYYY-MM-DD in local time
export const getLocalDateString = (date?: Date): string => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formats "2026-07-16" -> "16 Temmuz"
export const getFormattedDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const monthName = MONTH_NAMES[month - 1];
  return `${day} ${monthName}`;
};

// Formats "2026-07-16" -> "16 Temmuz Perşembe"
export const getFormattedFullDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const monthName = MONTH_NAMES[month - 1];
  const weekdayName = WEEKDAYS[d.getDay()];
  return `${day} ${monthName} ${weekdayName}`;
};

// Formats time from Date object -> "HH:MM"
export const getFormattedTime = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

// Returns a list of last N dateKeys (including today)
export const getPastDaysList = (count: number): string[] => {
  const list: string[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    list.push(getLocalDateString(d));
  }
  return list;
};
