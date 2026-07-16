import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ScrollView,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { Card } from '../components/Card';
import { getLocalDateString } from '../utils/date';
import {
  generateCalendarGrid,
  getMonthName,
  CalendarDay,
} from '../features/calendar/utils/calendarUtils';
import {
  hasDataForDate,
  getMonthSummary,
  getDaySummary,
} from '../features/calendar/selectors/calendarSelectors';
import { DayDetailScreen } from './DayDetailScreen';
import { AppHeader } from '../components/AppHeader';

export const CalendarScreen: React.FC = () => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;
  const store = useWellnessStore();

  const todayStr = getLocalDateString();
  const [todayYear, todayMonthVal] = todayStr.split('-').map(Number);

  // States
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonthVal);
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);

  // Constants
  const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Month navigation handlers
  const handlePrevMonth = () => {
    let prevM = month - 1;
    let prevY = year;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    setMonth(prevM);
    setYear(prevY);
  };

  const handleNextMonth = () => {
    const today = new Date();
    const limitYear = today.getFullYear();
    const limitMonth = today.getMonth() + 2; 

    let nextM = month + 1;
    let nextY = year;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }

    const limitVal = limitYear * 12 + limitMonth;
    const nextVal = nextY * 12 + nextM;

    if (nextVal > limitVal) {
      return; 
    }

    setMonth(nextM);
    setYear(nextY);
  };

  // Instantly return to current month & select today
  const handleResetToToday = () => {
    setYear(todayYear);
    setMonth(todayMonthVal);
    setActiveDateKey(todayStr);
  };

  // Generate grid days for the month
  const gridDays = useMemo(() => {
    return generateCalendarGrid(year, month);
  }, [year, month]);

  // Compute month activity summary
  const summary = useMemo(() => {
    return getMonthSummary(year, month, store);
  }, [year, month, store]);

  // If a day is active, redirect layout rendering to DayDetailScreen
  if (activeDateKey) {
    return (
      <DayDetailScreen
        dateKey={activeDateKey}
        onBack={() => setActiveDateKey(null)}
      />
    );
  }

  const renderGridHeader = () => {
    return (
      <View style={styles.gridHeaderRow}>
        {weekdays.map((day) => (
          <Text key={day} style={[styles.gridHeaderCell, { color: colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>
    );
  };

  const renderDayItem = ({ item }: { item: CalendarDay }) => {
    const isToday = item.dateKey === todayStr;
    
    // Fetch day summary to calculate progress values
    const daySummary = getDaySummary(item.dateKey, store);
    const hasData = daySummary.hasAnyData;

    // Calculate progress (Water 25%, Sleep 25%, Habits 30%, Mood 20%)
    const waterScore = Math.min(1, daySummary.waterAmount / store.waterTarget);
    const sleepScore = Math.min(1, (daySummary.sleepMinutes / 60) / store.sleepTarget);
    const moodScore = daySummary.latestMood ? 1 : 0;
    
    let habitScore = 1;
    if (daySummary.habitsPlanned > 0) {
      habitScore = daySummary.habitsCompleted / daySummary.habitsPlanned;
    }

    const progress = hasData
      ? (waterScore * 0.25) + (sleepScore * 0.25) + (habitScore * 0.3) + (moodScore * 0.2)
      : 0;

    let level = 0;
    if (progress > 0) {
      if (progress <= 0.4) level = 1;
      else if (progress <= 0.8) level = 2;
      else level = 3;
    }

    // Determine day cell color theme
    let cellBg = colors.card;
    let textColor = colors.text;

    if (level === 1) {
      cellBg = colors.primaryLight; // #FFEBE8
    } else if (level === 2) {
      cellBg = currentTheme === 'light' ? '#FFC3BB' : '#5A322D';
    } else if (level === 3) {
      cellBg = colors.primary; // #FF8A7A
      textColor = '#FFFFFF';
    }

    // Mood Emoji in corner
    const moodEmojis: Record<string, string> = {
      great: '😁',
      good: '🙂',
      neutral: '😐',
      bad: '😔',
      difficult: '😣',
    };
    const moodEmoji = daySummary.latestMood ? moodEmojis[daySummary.latestMood.mood] : null;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.dayCell,
          !item.isCurrentMonth && { opacity: 0.35 },
          { backgroundColor: cellBg },
          isToday && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: theme.borderRadius.sm },
        ]}
        onPress={() => setActiveDateKey(item.dateKey)}
        accessibilityRole="button"
        accessibilityLabel={`${item.day} ${getMonthName(month)} ${year}${isToday ? ', bugün' : ''}${hasData ? ', kayıt mevcut' : ''}`}
      >
        <Text style={[styles.dayText, { color: textColor }]}>
          {item.day}
        </Text>
        
        {/* Mood Emoji in top right corner */}
        {moodEmoji && (
          <Text style={styles.dayMoodEmoji}>{moodEmoji}</Text>
        )}

        {/* Small single indicator dot */}
        <View style={styles.indicatorContainer}>
          {hasData && (
            <View style={[styles.indicatorDot, { backgroundColor: level === 3 ? '#FFFFFF' : colors.primary }]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <AppHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Month Navigator Selector Row */}
        <View style={styles.navigatorRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePrevMonth}
            style={[styles.navBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Text style={[styles.navBtnText, { color: colors.text }]}>◀</Text>
          </TouchableOpacity>
          
          <Text style={[styles.monthLabel, { color: colors.text }]}>
            {getMonthName(month)} {year}
          </Text>
          
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNextMonth}
            style={[styles.navBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Text style={[styles.navBtnText, { color: colors.text }]}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Days Grid */}
        <Card style={styles.calendarCard}>
          {renderGridHeader()}
          <FlatList
            data={gridDays}
            renderItem={renderDayItem}
            keyExtractor={(item) => item.dateKey}
            numColumns={7}
            scrollEnabled={false}
          />
        </Card>

        {/* Renk Açıklamaları (Color Legend Card) */}
        <Card style={styles.legendCard}>
          <Text style={[styles.legendTitle, { color: colors.text }]}>Renk Açıklamaları</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Kayıt Yok / %0</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: colors.primaryLight }]} />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>%1 - %40 Tamamlandı</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: currentTheme === 'light' ? '#FFC3BB' : '#5A322D' }]} />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>%41 - %80 Tamamlandı</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>%81 - %100 Başarı</Text>
            </View>
          </View>
        </Card>

        {/* Monthly Activity Summary Panel */}
        <View style={styles.summarySection}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            {getMonthName(month)} Aktivite Özeti
          </Text>
          
          <View style={styles.summaryGrid}>
            <Card style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>💧</Text>
              <Text style={[styles.summaryCount, { color: colors.text }]}>
                {summary.waterDaysCount} Gün
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Su Kaydı
              </Text>
            </Card>

            <Card style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>🌱</Text>
              <Text style={[styles.summaryCount, { color: colors.text }]}>
                {summary.habitCompletionsCount} Adet
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Tamamlama
              </Text>
            </Card>

            <Card style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>🧠</Text>
              <Text style={[styles.summaryCount, { color: colors.text }]}>
                {summary.moodEntriesCount} Adet
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Ruh Hali
              </Text>
            </Card>

            <Card style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>😴</Text>
              <Text style={[styles.summaryCount, { color: colors.text }]}>
                {summary.sleepDaysCount} Gün
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Uyku Kaydı
              </Text>
            </Card>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.titleSm,
    fontWeight: 'bold',
  },
  todayBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
  },
  todayBtnText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  navigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 12,
  },
  monthLabel: {
    fontSize: theme.typography.sizes.titleSm,
    fontWeight: 'bold',
  },
  calendarCard: {
    marginHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.sm,
  },
  gridHeaderCell: {
    width: 40,
    textAlign: 'center',
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  dayCell: {
    width: '14.28%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    position: 'relative',
  },
  dayText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '700',
  },
  dayMoodEmoji: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
  },
  indicatorContainer: {
    height: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legendCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  legendTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '45%',
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
  },
  summarySection: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  summaryTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
});
