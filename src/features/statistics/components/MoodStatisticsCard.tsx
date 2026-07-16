import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { getMoodStatistics } from '../selectors/statisticsSelectors';
import { CustomBarChart } from './CustomBarChart';
import { MOOD_LIST, getMoodDetails } from '../../mood/utils/moodHelpers';

interface MoodStatisticsCardProps {
  range: string[];
}

export const MoodStatisticsCard: React.FC<MoodStatisticsCardProps> = ({ range }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const moodEntries = useWellnessStore((state) => state.moodEntries);

  // Compute stats
  const stats = React.useMemo(() => {
    return getMoodStatistics(moodEntries, range);
  }, [moodEntries, range]);

  const totalLogs = React.useMemo(() => {
    return Object.values(stats.distribution).reduce((sum, val) => sum + val, 0);
  }, [stats.distribution]);

  const hasData = totalLogs > 0;
  const mostFrequentDetails = stats.mostFrequent ? getMoodDetails(stats.mostFrequent) : null;

  const wordCloudWords = React.useMemo(() => {
    const STOP_WORDS = new Set([
      've', 'bir', 'ama', 'da', 'de', 'çok', 'her', 'için', 'en', 'bu', 'o', 'şu', 'ile', 'ise', 'ki', 'mi', 'mu', 'mü', 'ya', 'ne', 'sonra', 'önce', 'kadar', 'gibi', 'şey', 'daha', 'ben', 'sen', 'biz', 'siz', 'onlar', 'böyle', 'şöyle', 'miyim', 'misin', 'iyi', 'kötü', 'hissediyorum', 'hissediyor', 'bugün', 'gün', 'yine', 'biraz', 'baya', 'pek', 'hiç', 'var', 'yok', 'oldu', 'olduğunu', 'olmak', 'kendi', 'hemen', 'zaten', 'sadece', 'şimdi', 'biri', 'hepsi', 'bazı', 'çünkü', 'kötü', 'güzel'
    ]);

    const getMoodScore = (mood: string): number => {
      switch (mood) {
        case 'terrible': return 1;
        case 'bad': return 2;
        case 'neutral': return 3;
        case 'good': return 4;
        case 'excellent': return 5;
        default: return 3;
      }
    };

    const cleanText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const wordStats: { [word: string]: { count: number; scoreSum: number } } = {};

    moodEntries.forEach((entry) => {
      if (range.includes(entry.dateKey) && entry.note && entry.note.trim().length > 0) {
        const cleaned = cleanText(entry.note);
        const words = cleaned.split(' ');
        const score = getMoodScore(entry.mood);

        words.forEach((word) => {
          if (word.length > 2 && !STOP_WORDS.has(word)) {
            if (!wordStats[word]) {
              wordStats[word] = { count: 0, scoreSum: 0 };
            }
            wordStats[word].count += 1;
            wordStats[word].scoreSum += score;
          }
        });
      }
    });

    const list = Object.keys(wordStats).map((word) => {
      const stat = wordStats[word];
      const avgScore = stat.scoreSum / stat.count;
      return {
        word,
        count: stat.count,
        avgScore,
      };
    });

    list.sort((a, b) => b.count - a.count);
    return list.slice(0, 15);
  }, [moodEntries, range]);

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>😊 Ruh Hali</Text>

      {!hasData ? (
        <EmptyState
          title="Veri bulunamadı"
          description="Bu dönem için ruh hali kaydı bulunmuyor."
        />
      ) : (
        <View style={styles.content}>
          
          {/* Most Frequent Mood Display */}
          {mostFrequentDetails && (
            <View style={styles.frequentBlock}>
              <Text style={[styles.frequentLabel, { color: colors.textSecondary }]}>En Sık Hissedilen</Text>
              <View style={[styles.frequentBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={styles.frequentEmoji}>{mostFrequentDetails.emoji}</Text>
                <Text style={[styles.frequentText, { color: colors.text }]}>{mostFrequentDetails.label}</Text>
              </View>
            </View>
          )}

          {/* Distribution list */}
          <View style={styles.distContainer}>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>📊 Genel Dağılım</Text>
            <View style={styles.distList}>
              {MOOD_LIST.map((m) => {
                const count = stats.distribution[m.mood] || 0;
                return (
                  <View key={m.mood} style={[styles.distRow, { borderColor: colors.border }]}>
                    <View style={styles.distLabelCol}>
                      <Text style={styles.distEmoji}>{m.emoji}</Text>
                      <Text style={[styles.distText, { color: colors.text }]}>{m.label}</Text>
                    </View>
                    <Text style={[styles.distCount, { color: colors.textSecondary }]}>
                      {count} adet
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Chart preview */}
          <CustomBarChart data={stats.chartData} type="mood" color={colors.primary} />

          {/* Word Cloud / Kelime Bulutu */}
          {wordCloudWords.length > 0 && (
            <View style={styles.wordCloudContainer}>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                📝 Kelime Bulutu ve Ruh Hali Eşleşmesi
              </Text>
              <Text style={[styles.wordCloudHelperText, { color: colors.textSecondary }]}>
                Notlarında en sık kullandığın kelimelerin ruh haline etkisi (Büyük kelimeler daha sık yazıldı).
              </Text>
              
              <View style={[styles.wordCloudCloud, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                {wordCloudWords.map((item) => {
                  let wordColor = colors.textSecondary;
                  if (item.avgScore >= 3.8) {
                    wordColor = colors.success;
                  } else if (item.avgScore <= 2.4) {
                    wordColor = colors.danger;
                  }

                  const fontSize = Math.min(24, Math.max(11, 10 + item.count * 2));

                  return (
                    <Text
                      key={item.word}
                      style={[
                        styles.wordCloudText,
                        {
                          fontSize,
                          color: wordColor,
                          opacity: 0.9,
                        },
                      ]}
                    >
                      {item.word}
                    </Text>
                  );
                })}
              </View>

              {/* Word Cloud Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Pozitif</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Negatif</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.textSecondary }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Dengeli / Nötr</Text>
                </View>
              </View>
            </View>
          )}
          
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.md,
  },
  content: {
    width: '100%',
  },
  frequentBlock: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: theme.borderRadius.sm,
  },
  frequentLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  frequentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
  },
  frequentEmoji: {
    fontSize: 20,
  },
  frequentText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  distContainer: {
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  distList: {
    gap: 4,
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
  },
  distLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distEmoji: {
    fontSize: 14,
  },
  distText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  distCount: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '700',
  },
  wordCloudContainer: {
    marginTop: theme.spacing.lg,
    gap: 4,
  },
  wordCloudHelperText: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 8,
  },
  wordCloudCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    minHeight: 100,
  },
  wordCloudText: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    paddingHorizontal: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
