import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { getLocalDateString } from '../../../utils/date';

// Motivational messages rotated daily
const DAILY_MESSAGES = [
  'Küçük adımlar büyük değişimler yaratır. Bugün de devam et! 💪',
  'Kendini yorgun hissediyorsan derin bir nefes al ve esne. Devam edecek gücün var. 💪',
  'Bugün kendine iyi bak. Sen bunu hak ediyorsun. 🌸',
  'Her yeni gün taze bir başlangıçtır. Güzel şeyler seni bekliyor! ✨',
  'Su içmeyi unutma! Vücudun sana teşekkür edecek. 💧',
  'Alışkanlıklar hayatı şekillendirir. Bugün de devam! 🌱',
  'İyi uyku, iyi gün demektir. Kendine nazik ol. 😴',
  'Ruh halin mi yüksek? Harika! Düşükse, bu da geçer. 🌈',
  'Mükemmel olmak zorunda değilsin, sadece devam et. 🚀',
];

const getDailyMessage = (): string => {
  const dateKey = getLocalDateString();
  // Hash the date string to a stable index
  const sum = dateKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return DAILY_MESSAGES[sum % DAILY_MESSAGES.length];
};

export const GreetingHeader: React.FC = () => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const username = useWellnessStore((state) => state.username);
  const colors = theme[currentTheme].colors;

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Günaydın, ${username}!`;
    if (hour >= 12 && hour < 18) return `İyi günler, ${username}!`;
    if (hour >= 18 && hour < 23) return `İyi akşamlar, ${username}!`;
    return `İyi geceler, ${username}!`;
  };

  const cardBg = currentTheme === 'dark' ? '#2D1A18' : '#FFEBE8';

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>
      {/* Text content */}
      <View style={styles.textContent}>
        <Text style={[styles.greetingText, { color: colors.text }]}>
          {getGreeting()}
        </Text>
        <Text style={[styles.messageText, { color: colors.textSecondary }]}>
          {getDailyMessage()}
        </Text>
      </View>

      {/* Sun decoration */}
      <Text style={styles.sunEmoji}>☀️</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  greetingText: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.title,
    marginBottom: 6,
  },
  messageText: {
    fontFamily: theme.typography.fontFamilyMedium,
    fontSize: theme.typography.sizes.bodySm,
    lineHeight: 18,
  },
  sunEmoji: {
    fontSize: 40,
  },
});
