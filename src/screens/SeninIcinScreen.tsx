import React, { useState, useMemo } from 'react';
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
import { SpecialMessage } from '../types';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { getLocalDateString, getFormattedDisplayDate, getPastDaysList } from '../utils/date';
import { STATIC_SPECIAL_MESSAGES } from '../features/specialMessages/data/messages';
import {
  getDailyMessage,
  isMessageUnlocked,
  getUnlockHint,
  UnlockVerificationData,
  replacePlaceholders,
} from '../features/specialMessages/utils/messageHelpers';

// Subcomponents
import { MessageDetailModal } from '../features/specialMessages/components/MessageDetailModal';

interface SeninIcinScreenProps {
  onBack: () => void;
}

export const SeninIcinScreen: React.FC<SeninIcinScreenProps> = ({ onBack }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const username = useWellnessStore((state) => state.username);
  const history = useWellnessStore((state) => state.history);
  const waterTarget = useWellnessStore((state) => state.waterTarget);
  const completions = useWellnessStore((state) => state.habitCompletions);
  const appUsageDays = useWellnessStore((state) => state.appUsageDays);

  const readMessageIds = useWellnessStore((state) => state.readMessageIds);
  const favoriteMessageIds = useWellnessStore((state) => state.favoriteMessageIds);
  const easterEggUnlocked = useWellnessStore((state) => state.easterEggUnlocked);
  const unlockEasterEgg = useWellnessStore((state) => state.unlockEasterEgg);

  const todayKey = getLocalDateString();

  // Easter Egg Taps State
  const [easterTaps, setEasterTaps] = useState(0);

  // Modals state
  const [detailVisible, setDetailVisible] = useState(false);
  const [activeMessage, setActiveMessage] = useState<SpecialMessage | undefined>(undefined);

  // Easter egg special message data
  const easterMessage: SpecialMessage = useMemo(() => {
    return {
      id: 'easter-egg',
      title: 'Gizli Mektup 🗝️',
      content: 'Bunu bulacağını biliyordum. ❤️',
      type: 'surprise',
      author: 'Serdar',
      scheduledDate: null,
      unlockCondition: null,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
  }, []);

  // 1. Calculate unlock metrics
  const waterGoalDaysCount = useMemo(() => {
    let count = 0;
    Object.keys(history).forEach((dk) => {
      const record = history[dk];
      if (record && record.waterEntries) {
        const sum = record.waterEntries.reduce((s, e) => s + e.amount, 0);
        if (sum >= waterTarget) {
          count++;
        }
      }
    });
    return count;
  }, [history, waterTarget]);

  const unlockData: UnlockVerificationData = useMemo(() => {
    return {
      appDays: appUsageDays.length,
      waterGoalDays: waterGoalDaysCount,
      habitCompletions: completions.length,
      todayDateKey: todayKey,
    };
  }, [appUsageDays.length, waterGoalDaysCount, completions.length, todayKey]);

  // 2. Get today's daily message
  const todayMessage = useMemo(() => {
    return getDailyMessage(todayKey);
  }, [todayKey]);

  // 3. Compile Surprises & Milestones list
  const surpriseMessages = useMemo(() => {
    const list = STATIC_SPECIAL_MESSAGES.filter(
      (m) => m.type === 'surprise' || m.type === 'milestone' || m.type === 'scheduled'
    );
    // Add easter egg if unlocked
    if (easterEggUnlocked) {
      list.push(easterMessage);
    }
    return list;
  }, [easterEggUnlocked, easterMessage]);

  // 4. Compile Favourites list
  const favoriteMessages = useMemo(() => {
    const list: SpecialMessage[] = [];
    
    // Check daily messages
    const allDailies = STATIC_SPECIAL_MESSAGES.filter((m) => m.type === 'daily');
    allDailies.forEach((m) => {
      if (favoriteMessageIds.includes(m.id)) {
        list.push(m);
      }
    });

    // Check milestones/surprises
    surpriseMessages.forEach((m) => {
      if (favoriteMessageIds.includes(m.id)) {
        list.push(m);
      }
    });

    // Check if the current easter egg is favorited
    if (easterEggUnlocked && favoriteMessageIds.includes(easterMessage.id)) {
      list.push(easterMessage);
    }

    // Deduplicate in case
    return Array.from(new Set(list.map((m) => m.id)))
      .map((id) => {
        if (id === 'easter-egg') return easterMessage;
        return STATIC_SPECIAL_MESSAGES.find((m) => m.id === id);
      })
      .filter((m): m is SpecialMessage => !!m);
  }, [favoriteMessageIds, surpriseMessages, easterEggUnlocked, easterMessage]);

  // 5. Compile Last 7 Days messages list
  const historyMessages = useMemo(() => {
    const list = [];
    const past7Days = getPastDaysList(8).slice(1); // skip today, get next 7 days
    
    for (const dk of past7Days) {
      const msg = getDailyMessage(dk);
      list.push({
        dateKey: dk,
        message: msg,
      });
    }
    return list;
  }, []);

  const handleMessageTap = (msg: SpecialMessage) => {
    setActiveMessage(msg);
    setDetailVisible(true);
  };

  const handleEasterTap = () => {
    if (easterEggUnlocked) {
      handleMessageTap(easterMessage);
      return;
    }

    const nextTaps = easterTaps + 1;
    if (nextTaps >= 5) {
      setEasterTaps(0);
      unlockEasterEgg();
      Alert.alert('🗝️ Sır Keşfedildi', 'Bunu bulacağını biliyordum. ❤️');
      handleMessageTap(easterMessage);
    } else {
      setEasterTaps(nextTaps);
    }
  };

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
        
        {/* Tapping the icon 5 times triggers the easter egg */}
        <TouchableOpacity activeOpacity={0.8} style={styles.headerTitleContainer} onPress={handleEasterTap}>
          <Text style={styles.headerEmoji}>💌</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Senin İçin</Text>
        </TouchableOpacity>
        
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Bugünün Notu Card */}
        <SectionHeader title="Günün Tavsiye Mektubu 💌" />
        <Card style={styles.dailyCard} onPress={() => handleMessageTap(todayMessage)}>
          <Text style={[styles.dailyLabel, { color: colors.primary }]}>GÜNÜN TAVSİYESİ</Text>
          <Text style={[styles.dailyText, { color: colors.text }]}>
            "{replacePlaceholders(todayMessage.content, username)}"
          </Text>
          <View style={styles.openLetterIndicator}>
            <Text style={[styles.openLetterText, { color: colors.primary }]}>Oku ➔</Text>
          </View>
        </Card>

        {/* Sürprizler & Başarılar (Surprises) */}
        <SectionHeader title="Kilitli Sürpriz Mektuplar 🔒" />
        <View style={styles.surprisesList}>
          {surpriseMessages.map((m) => {
            const unlocked = isMessageUnlocked(m, unlockData);
            const isRead = readMessageIds.includes(m.id);
            const isFav = favoriteMessageIds.includes(m.id);

            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={unlocked ? 0.7 : 1}
                disabled={!unlocked}
                style={[
                  styles.surpriseCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: unlocked ? colors.card : 'rgba(0,0,0,0.03)',
                  },
                ]}
                onPress={() => unlocked && handleMessageTap(m)}
              >
                <View style={styles.surpriseHeader}>
                  <Text
                    style={[
                      styles.surpriseTitle,
                      { color: unlocked ? colors.text : colors.textSecondary, fontWeight: unlocked ? 'bold' : 'normal' },
                    ]}
                  >
                    {unlocked ? m.title : `🔒 Kilitli Sürpriz`}
                  </Text>
                  
                  {unlocked && (
                    <View style={styles.badgeRow}>
                      {!isRead && (
                        <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.newBadgeText}>Yeni</Text>
                        </View>
                      )}
                      {isFav && <Text style={styles.favHeart}>♥︎</Text>}
                    </View>
                  )}
                </View>

                <Text style={[styles.surpriseHint, { color: colors.textSecondary }]}>
                  {unlocked ? 'Dokunup mektubu oku.' : getUnlockHint(m)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Favoriler (Favorites) - Only display if at least one is present */}
        {favoriteMessages.length > 0 && (
          <>
            <SectionHeader title="Favori Tavsiye Mektuplarım ♥︎" />
            <View style={styles.favoritesList}>
              {favoriteMessages.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.7}
                  style={[styles.favoriteRow, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => handleMessageTap(m)}
                >
                  <View style={styles.favRowHeader}>
                    <Text style={[styles.favRowTitle, { color: colors.text }]}>{m.title}</Text>
                    <Text style={styles.favHeart}>♥︎</Text>
                  </View>
                  <Text style={[styles.favRowSnippet, { color: colors.textSecondary }]} numberOfLines={1}>
                    {replacePlaceholders(m.content, username)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Geçmiş Notlar (History of past 7 days) */}
        <SectionHeader title="Tavsiye Mektupları Arşivi 🗓️" />
        <Card style={styles.historyCard}>
          <View style={styles.historyList}>
            {historyMessages.map(({ dateKey, message }, index) => {
              const dateLabel = index === 0 ? 'Dün' : getFormattedDisplayDate(dateKey);
              return (
                <TouchableOpacity
                  key={dateKey}
                  activeOpacity={0.7}
                  style={[
                    styles.historyRow,
                    { borderBottomColor: colors.border, paddingBottom: index === 6 ? 0 : 10 },
                  ]}
                  onPress={() => handleMessageTap(message)}
                >
                  <View style={styles.historyRowHeader}>
                    <Text style={[styles.historyRowLabel, { color: colors.text }]}>{dateLabel}</Text>
                    <Text style={[styles.historyRowSnippet, { color: colors.textSecondary }]} numberOfLines={1}>
                      {replacePlaceholders(message.content, username)}
                    </Text>
                  </View>
                  <Text style={[styles.historyArrow, { color: colors.textSecondary }]}>➔</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

      </ScrollView>

      {/* DETAIL MODAL */}
      <MessageDetailModal
        visible={detailVisible}
        onClose={() => {
          setDetailVisible(false);
          setActiveMessage(undefined);
        }}
        message={activeMessage}
      />

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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerEmoji: {
    fontSize: 18,
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
  dailyCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    marginBottom: theme.spacing.xs,
  },
  dailyLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  dailyText: {
    fontSize: theme.typography.sizes.body,
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  authorText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  openLetterIndicator: {
    marginTop: theme.spacing.sm,
  },
  openLetterText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  surprisesList: {
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  surpriseCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  surpriseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  surpriseTitle: {
    fontSize: theme.typography.sizes.bodySm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  favHeart: {
    color: '#EF4444',
    fontSize: 16,
  },
  surpriseHint: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  favoritesList: {
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  favoriteRow: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  favRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  favRowTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  favRowSnippet: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
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
  historyRowHeader: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  historyRowLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  historyRowSnippet: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  historyArrow: {
    fontSize: 11,
  },
});
