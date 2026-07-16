export interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  dateKey: string;
}

// Generate the calendar grid days for a given year and month (1-indexed)
// Turkish standard: week starts on Monday
export const generateCalendarGrid = (year: number, month: number): CalendarDay[] => {
  const daysList: CalendarDay[] = [];

  // 1. Get the weekday of the 1st of the month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDay = new Date(year, month - 1, 1);
  let startDayOfWeek = firstDay.getDay();

  // Convert to Monday start: Monday = 1, Tuesday = 2, ..., Sunday = 7
  if (startDayOfWeek === 0) {
    startDayOfWeek = 7;
  }
  const prevMonthPaddingCount = startDayOfWeek - 1; // days to show from previous month

  // 2. Get total days in current month
  const daysInMonth = new Date(year, month, 0).getDate();

  // 3. Fill previous month padding
  // Calculate previous month details
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

  for (let i = prevMonthPaddingCount; i > 0; i--) {
    const dVal = daysInPrevMonth - i + 1;
    daysList.push({
      day: dVal,
      isCurrentMonth: false,
      dateKey: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dVal).padStart(2, '0')}`,
    });
  }

  // 4. Fill current month days
  for (let d = 1; d <= daysInMonth; d++) {
    daysList.push({
      day: d,
      isCurrentMonth: true,
      dateKey: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  // 5. Fill next month padding to make it exactly 42 cells (6 rows of 7 days)
  const totalCellsNeeded = 42;
  const nextMonthPaddingCount = totalCellsNeeded - daysList.length;

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  for (let d = 1; d <= nextMonthPaddingCount; d++) {
    daysList.push({
      day: d,
      isCurrentMonth: false,
      dateKey: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  return daysList;
};

// Turkish month name mapper
export const getMonthName = (month: number): string => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[month - 1] || '';
};
