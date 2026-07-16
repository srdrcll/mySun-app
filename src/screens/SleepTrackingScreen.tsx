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
import { SleepEntry } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { getLocalDateString, getFormattedDisplayDate, getFormattedFullDate } from '../utils/date';
import { formatSleepDuration, formatSleepDurationFull, calculateAverageSleep } from '../features/sleep/utils/sleepHelpers';

// Subcomponents
import { SleepLogModal } from '../features/sleep/components/SleepLogModal';

interface SleepTrackingScreenProps {
  onBack: () => void;
}

export const SleepTrackingScreen: React.FC<SleepTrackingScreenProps> = ({ onBack }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const sleepEntries = useWellnessStore((state) => state.sleepEntries);
  const deleteSleepEntry = useWellnessStore((state) => state.deleteSleepEntry);

  const todayKey = getLocalDateString();

  // Modals state
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<SleepEntry | undefined>(undefined);
  const [selectedPastDate, setSelectedPastDate] = useState<string | null>(null);

  // Get latest completed sleep entry based on wakeTime timestamp
  const getLatestSleepEntry = (): SleepEntry | undefined => {
    if (sleepEntries.length === 0) return undefined;
    const sorted = [...sleepEntries].sort(
      (a, b) => new Date(b.wakeTime).getTime() - new Date(a.wakeTime).getTime()
    );
    return sorted[0];
  };

  const latestEntry = getLatestSleepEntry();

  const handleOpenEdit = (entry: SleepEntry) => {
    setEntryToEdit(entry);
    setLogModalVisible(true);
  };

  const handleDeletePress = (id: string) => {
    Alert.alert(
      'Kayıt Silinsin mi?',
      'Bu uyku kaydını silmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            deleteSleepEntry(id);
            // Close detailed past day modal if the last log is deleted
            if (selectedPastDate) {
              const remaining = sleepEntries.filter((e) => e.id !== id && e.dateKey === selectedPastDate);
              if (remaining.length === 0) {
                setSelectedPastDate(null);
              }
            }
          },
        },
      ]
    );
  };

  const getFormattedTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '--:--';
    }
  };

  const getFormattedDateLabel = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return getFormattedDisplayDate(`${year}-${month}-${day}`);
    } catch {
      return '';
    }
  };

  // Generate last 7 days (today first, down to 6 days ago)
  const getPast7Days = () => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      list.push(getLocalDateString(d));
    }
    return list;
  };

  const past7Days = getPast7Days();

  // Average sleep duration of logged days in the last 7 days
  const averageMinutes = calculateAverageSleep(sleepEntries, 7);

  // Filter logs for selected past date modal
  const pastDateEntries = selectedPastDate
    ? [...sleepEntries.filter((e) => e.dateKey === selectedPastDate)].sort(
        (a, b) => new Date(a.sleepTime).getTime() - new Date(b.sleepTime).getTime()
      ) // Ascending order chronologically
    : [];

  const pastDateTotalMinutes = pastDateEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Uyku Takibi</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Latest Sleep Entry card */}
        <Card style={styles.latestCard}>
          <Text style={[styles.latestLabel, { color: colors.textSecondary }]}>Son Uyku</Text>
          
          {latestEntry ? (
            <View style={styles.latestContent}>
              <Text style={[styles.durationVal, { color: colors.text }]}>
                {formatSleepDurationFull(latestEntry.durationMinutes)}
              </Text>
              
              <Text style={[styles.periodVal, { color: colors.primary }]}>
                {getFormattedTime(latestEntry.sleepTime)} → {getFormattedTime(latestEntry.wakeTime)}
              </Text>

              <Text style={[styles.dateRangeText, { color: colors.textSecondary }]}>
                {getFormattedDateLabel(latestEntry.sleepTime)} {getFormattedDateLabel(latestEntry.sleepTime) !== getFormattedDateLabel(latestEntry.wakeTime) ? `→ ${getFormattedDateLabel(latestEntry.wakeTime)}` : ''}
              </Text>

              <Button
                title="Düzenle"
                variant="outline"
                size="sm"
                style={styles.editBtn}
                onPress={() => handleOpenEdit(latestEntry)}
              />
            </View>
          ) : (
            <View style={styles.emptyCardContent}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Henüz kayıtlı bir uyku verisi bulunmuyor.
              </Text>
            </View>
          )}
        </Card>

        {/* Ekle Button */}
        <Button
          title="+ Uyku Kaydı Ekle"
          variant="primary"
          style={styles.addSleepBtn}
          onPress={() => {
            setEntryToEdit(undefined);
            setLogModalVisible(true);
          }}
        />

        {/* Weekly Average */}
        {averageMinutes > 0 && (
          <Card style={styles.averageCard}>
            <Text style={[styles.avgTitle, { color: colors.textSecondary }]}>Son 7 Gün Ortalaması</Text>
            <Text style={[styles.avgVal, { color: colors.success }]}>
              {formatSleepDurationFull(averageMinutes)}
            </Text>
            <Text style={[styles.avgDesc, { color: colors.textSecondary }]}>
              *Ortalama hesaplanırken sadece uyku kaydı bulunan günler dikkate alınmıştır.
            </Text>
          </Card>
        )}

        {/* 10. Son 7 Günlük Liste */}
        <SectionHeader title="Son 7 Günlük Geçmiş 🗓️" />
        <Card style={styles.historyCard}>
          <View style={styles.historyList}>
            {past7Days.map((dateKey, index) => {
              const dayEntries = sleepEntries.filter((e) => e.dateKey === dateKey);
              const dayTotal = dayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
              
              const dayLabel = index === 0 ? 'Bugün' : index === 1 ? 'Dün' : getFormattedDisplayDate(dateKey);

              return (
                <TouchableOpacity
                  key={dateKey}
                  activeOpacity={dayTotal > 0 ? 0.7 : 1}
                  style={[
                    styles.historyRow,
                    { borderBottomColor: colors.border, paddingBottom: index === 6 ? 0 : 10 },
                  ]}
                  onPress={() => dayTotal > 0 && setSelectedPastDate(dateKey)}
                  disabled={dayTotal === 0}
                >
                  <Text style={[styles.historyRowLabel, { color: colors.text }]}>{dayLabel}</Text>
                  
                  {dayTotal > 0 ? (
                    <View style={styles.historyProgressCol}>
                      <Text style={[styles.historyValText, { color: colors.primary }]}>
                        {formatSleepDuration(dayTotal)}
                      </Text>
                      {dayEntries.length > 1 && (
                        <Text style={[styles.historyNapCount, { color: colors.textSecondary }]}>
                          ({dayEntries.length} kayıt)
                        </Text>
                      )}
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
      <SleepLogModal
        visible={logModalVisible}
        onClose={() => {
          setLogModalVisible(false);
          setEntryToEdit(undefined);
        }}
        entryToEdit={entryToEdit}
      />

      {/* 15. PAST DATE DAY DETAILS MODAL */}
      <Modal
        visible={selectedPastDate !== null}
        onClose={() => setSelectedPastDate(null)}
        title={selectedPastDate ? getFormattedFullDate(selectedPastDate) : 'Günlük Uyku Detayı'}
      >
        <ScrollView style={styles.pastDateScrollView}>
          <View style={styles.pastDateList}>
            {pastDateEntries.map((entry, index) => (
              <View
                key={entry.id}
                style={[styles.entryCard, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <View style={styles.entryHeaderRow}>
                  <Text style={[styles.entryTitle, { color: colors.text }]}>
                    {index === 0 && pastDateEntries.length > 1 ? '💤 Gece Uykusu' : '😴 Uyku Kaydı'}
                  </Text>
                  <Text style={[styles.entryDurationText, { color: colors.success }]}>
                    {formatSleepDuration(entry.durationMinutes)}
                  </Text>
                </View>

                <Text style={[styles.entryTimes, { color: colors.textSecondary }]}>
                  ⏰ {getFormattedTime(entry.sleepTime)} → {getFormattedTime(entry.wakeTime)}
                </Text>
                
                <Text style={[styles.entryMeta, { color: colors.textSecondary }]}>
                  🗓️ {getFormattedDateLabel(entry.sleepTime)} → {getFormattedDateLabel(entry.wakeTime)} • Source: {entry.source}
                </Text>

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
            ))}

            {/* Daily Total Summary */}
            {pastDateEntries.length > 1 && (
              <View style={[styles.totalSummaryCard, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.totalSummaryText, { color: colors.text }]}>
                  Günlük Toplam Uyku: <Text style={{ fontWeight: 'bold' }}>{formatSleepDuration(pastDateTotalMinutes)}</Text>
                </Text>
              </View>
            )}
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
  latestCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  latestLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  latestContent: {
    alignItems: 'center',
    width: '100%',
  },
  durationVal: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  periodVal: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  dateRangeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  editBtn: {
    width: 'auto',
    minWidth: 120,
    minHeight: 32,
  },
  emptyCardContent: {
    paddingVertical: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.sizes.bodySm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  addSleepBtn: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  averageCard: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avgTitle: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  avgVal: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  avgDesc: {
    fontSize: 9,
    fontStyle: 'italic',
    textAlign: 'center',
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
  historyProgressCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyValText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  historyNapCount: {
    fontSize: 10,
    fontWeight: '600',
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
  entryCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: 8,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  entryDurationText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  entryTimes: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
    marginBottom: 4,
  },
  entryMeta: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
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
  totalSummaryCard: {
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: 4,
  },
  totalSummaryText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
});
