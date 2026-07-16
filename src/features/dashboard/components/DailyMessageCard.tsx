import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { getLocalDateString } from '../../../utils/date';
import { getDailyMessage, replacePlaceholders } from '../../specialMessages/utils/messageHelpers';

interface DailyMessageCardProps {
  onPress: () => void;
}

export const DailyMessageCard: React.FC<DailyMessageCardProps> = ({ onPress }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const username = useWellnessStore((state) => state.username);
  
  const todayKey = getLocalDateString();
  const todayMessage = getDailyMessage(todayKey);
  const resolvedContent = replacePlaceholders(todayMessage.content, username);

  return (
    <Card variant="flat" style={styles.card} onPress={onPress}>
      <Text style={[styles.title, { color: colors.primary }]}>Bugünün Notu 💌</Text>
      <Text style={[styles.messageText, { color: colors.text }]}>
        "{resolvedContent}"
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  title: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.bodySm,
    marginBottom: 6,
  },
  messageText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.medium,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
  },
});
