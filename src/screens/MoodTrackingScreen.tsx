import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { MoodType, MoodEntry } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { getLocalDateString, getFormattedDisplayDate, getFormattedFullDate } from '../utils/date';
import { MOOD_LIST, getMoodDetails } from '../features/mood/utils/moodHelpers';

// Subcomponents
import { MoodLogModal } from '../features/mood/components/MoodLogModal';
import { MoodSummary } from '../features/mood/components/MoodSummary';

interface MoodTrackingScreenProps {
  onBack: () => void;
}

export const MoodTrackingScreen: React.FC<MoodTrackingScreenProps> = ({ onBack }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const entries = useWellnessStore((state) => state.moodEntries);
  const deleteMoodEntry = useWellnessStore((state) => state.deleteMoodEntry);

  const todayKey = getLocalDateString();

  // Today's entries
  const todayEntries = entries.filter((e) => e.dateKey === todayKey);
  const sortedTodayEntries = [...todayEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // States for logging modal
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [initialMood, setInitialMood] = useState<MoodType>('neutral');
  const [entryToEdit, setEntryToEdit] = useState<MoodEntry | undefined>(undefined);

  // States for past day detail modal
  const [selectedPastDate, setSelectedPastDate] = useState<string | null>(null);

  const handleOpenAdd = (mood: MoodType) => {
    setInitialMood(mood);
    setEntryToEdit(undefined);
    setLogModalVisible(true);
  };

  const handleOpenEdit = (entry: MoodEntry) => {
    setEntryToEdit(entry);
    setLogModalVisible(true);
  };

  const handleDeletePress = (id: string) => {
    Alert.alert(
      'Kayıt Silinsin mi?',
      'Bu ruh hali kaydını silmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            deleteMoodEntry(id);
            // If the deleted log was inside the currently open past date list, and was the last one, close details modal
            const remaining = entries.filter((e) => e.id !== id && e.dateKey === selectedPastDate);
            if (remaining.length === 0) {
              setSelectedPastDate(null);
            }
          },
        },
      ]
    );
  };

  const getFormattedTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    } catch {
      return '--:--';
    }
  };

  // Generate last 7 days (descending: today down to 6 days ago)
  const getPast7DaysList = () => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      list.push(getLocalDateString(d));
    }
    return list;
  };

  const past7Days = getPast7DaysList();

  const getLatestMoodForDate = (dateKey: string): MoodEntry | undefined => {
    const dayEntries = entries.filter((e) => e.dateKey === dateKey);
    if (dayEntries.length === 0) return undefined;
    const sorted = [...dayEntries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0];
  };

  // Filter logs for selected past date modal
  const pastDateEntries = selectedPastDate
    ? [...entries.filter((e) => e.dateKey === selectedPastDate)].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ) // Ascending order inside day details
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header Row */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Text style={[styles.backBtnText, { color: colors.text }]}>← Geri</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ruh Halim</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Large Mood Log Card */}
        <Card style={styles.logCard}>
          <Text style={[styles.logTitle, { color: colors.text }]}>Bugün nasıl hissediyorsun?</Text>
          <Text style={[styles.logSubtitle, { color: colors.textSecondary }]}>
            Kendinizi dinlemek için bir an ayırın ve hissinizi kaydedin.
          </Text>

          <View style={styles.emojiRow}>
            {MOOD_LIST.map((m) => (
              <TouchableOpacity
                key={m.mood}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={m.accessibilityLabel}
                style={[styles.emojiBtn, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => handleOpenAdd(m.mood)}
              >
                <Text style={styles.emojiText}>{m.emoji}</Text>
                <Text style={[styles.emojiLabel, { color: colors.text }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Bugünkü Kayıtlar */}
        <SectionHeader title="Bugünkü Kayıtlar 📝" />
        
        {sortedTodayEntries.length === 0 ? (
          <EmptyState
            title="Bugün henüz bir ruh hali kaydı oluşturmadın."
            description="Yukarıdaki emojilere dokunarak ilk hissini anında kaydedebilirsin."
          />
        ) : (
          <View style={styles.entriesList}>
            {sortedTodayEntries.map((entry) => {
              const details = getMoodDetails(entry.mood);
              return (
                <View
                  key={entry.id}
                  style={[styles.entryRow, { borderColor: colors.border, backgroundColor: colors.card }]}
                >
                  <View style={styles.entryHeaderRow}>
                    <View style={styles.moodBadgeCol}>
                      <Text style={styles.entryEmoji}>{details.emoji}</Text>
                      <Text style={[styles.entryMoodLabel, { color: details.color }]}>
                        {details.label}
                      </Text>
                    </View>
                    
                    <Text style={[styles.entryTime, { color: colors.textSecondary }]}>
                      {getFormattedTime(entry.timestamp)}
                    </Text>
                  </View>

                  {entry.note ? (
                    <Text style={[styles.entryNote, { color: colors.text }]}>
                      {entry.note}
                    </Text>
                  ) : null}

                  <View style={styles.entryActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.actionLink}
                      onPress={() => handleOpenEdit(entry)}
                    >
                      <Text style={[styles.actionLinkText, { color: colors.primary }]}>Düzenle</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.actionLink}
                      onPress={() => handleDeletePress(entry.id)}
                    >
                      <Text style={[styles.actionLinkText, { color: colors.danger }]}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 13. Son 7 Gün Dağılım Grafiği */}
        <MoodSummary />

        {/* 10. Son 7 Günlük Geçmiş Listesi */}
        <SectionHeader title="Son 7 Günlük Geçmiş 🗓️" />
        <Card style={styles.historyCard}>
          <View style={styles.historyList}>
            {past7Days.map((dateKey, index) => {
              const latest = getLatestMoodForDate(dateKey);
              const details = latest ? getMoodDetails(latest.mood) : null;
              
              const dayLabel = index === 0 ? 'Bugün' : index === 1 ? 'Dün' : getFormattedDisplayDate(dateKey);

              return (
                <TouchableOpacity
                  key={dateKey}
                  activeOpacity={latest ? 0.7 : 1}
                  style={[
                    styles.historyRow,
                    { borderBottomColor: colors.border, paddingBottom: index === 6 ? 0 : 10 },
                  ]}
                  onPress={() => latest && setSelectedPastDate(dateKey)}
                  disabled={!latest}
                >
                  <Text style={[styles.historyRowLabel, { color: colors.text }]}>{dayLabel}</Text>
                  
                  {details ? (
                    <View style={styles.historyMoodBadge}>
                      <Text style={styles.historyEmoji}>{details.emoji}</Text>
                      <Text style={[styles.historyLabelText, { color: details.color }]}>
                        {details.label}
                      </Text>
                      <Text style={[styles.historyArrow, { color: colors.textSecondary }]}>➔</Text>
                    </View>
                  ) : (
                    <Text style={[styles.historyEmptyText, { color: colors.textSecondary }]}>
                      —
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

      </ScrollView>

      {/* LOGGING MODAL */}
      <MoodLogModal
        visible={logModalVisible}
        onClose={() => {
          setLogModalVisible(false);
          setEntryToEdit(undefined);
        }}
        entryToEdit={entryToEdit}
        initialMood={initialMood}
      />

      {/* 11. PAST DATE ENTRIES DETAILS MODAL */}
      <Modal
        visible={selectedPastDate !== null}
        onClose={() => setSelectedPastDate(null)}
        title={selectedPastDate ? getFormattedFullDate(selectedPastDate) : 'Gün Detayı'}
      >
        <ScrollView style={styles.pastDateScrollView}>
          <View style={styles.pastDateList}>
            {pastDateEntries.map((entry) => {
              const details = getMoodDetails(entry.mood);
              return (
                <View
                  key={entry.id}
                  style={[styles.entryRow, { borderColor: colors.border, backgroundColor: colors.card, marginBottom: 8 }]}
                >
                  <View style={styles.entryHeaderRow}>
                    <View style={styles.moodBadgeCol}>
                      <Text style={styles.entryEmoji}>{details.emoji}</Text>
                      <Text style={[styles.entryMoodLabel, { color: details.color }]}>
                        {details.label}
                      </Text>
                    </View>
                    
                    <Text style={[styles.entryTime, { color: colors.textSecondary }]}>
                      {getFormattedTime(entry.timestamp)}
                    </Text>
                  </View>

                  {entry.note ? (
                    <Text style={[styles.entryNote, { color: colors.text }]}>
                      {entry.note}
                    </Text>
                  ) : null}

                  <View style={styles.entryActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.actionLink}
                      onPress={() => handleOpenEdit(entry)}
                    >
                      <Text style={[styles.actionLinkText, { color: colors.primary }]}>Düzenle</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.actionLink}
                      onPress={() => handleDeletePress(entry.id)}
                    >
                      <Text style={[styles.actionLinkText, { color: colors.danger }]}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <Button
          title="Kapat"
          variant="outline"
          style={{ marginTop: 8 }}
          onPress={() => setSelectedPastDate(null)}
        />
      </Modal>

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
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
  },
  backBtnText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.titleSm,
    fontWeight: 'bold',
  },
  backBtnPlaceholder: {
    width: 60,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 60,
  },
  logCard: {
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  logTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  logSubtitle: {
    fontSize: theme.typography.sizes.bodySm,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  emojiBtn: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    gap: 4,
  },
  emojiText: {
    fontSize: 24,
  },
  emojiLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  entriesList: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  entryRow: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  moodBadgeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryEmoji: {
    fontSize: 20,
  },
  entryMoodLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  entryTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  entryNote: {
    fontSize: theme.typography.sizes.bodySm,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 6,
    paddingLeft: 2,
  },
  entryActionsRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
    marginTop: 4,
  },
  actionLink: {
    paddingVertical: 2,
  },
  actionLinkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyCard: {
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  historyList: {
    gap: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyRowLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  historyMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyEmoji: {
    fontSize: 16,
  },
  historyLabelText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  historyArrow: {
    fontSize: 11,
    marginLeft: 2,
  },
  historyEmptyText: {
    fontSize: theme.typography.sizes.bodySm,
    marginRight: 6,
  },
  pastDateScrollView: {
    maxHeight: 320,
  },
  pastDateList: {
    paddingVertical: 4,
  },
});
