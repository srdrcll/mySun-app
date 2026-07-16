import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { SpinningSun } from './SpinningSun';

export const AppHeader: React.FC = () => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const setTheme = useWellnessStore((state) => state.setTheme);
  const colors = theme[currentTheme].colors;

  const getShortDate = (): string => {
    const today = new Date();
    return today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  const handleToggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      {/* Left: Spinning SVG Sun + Logo */}
      <View style={styles.logoRow}>
        <SpinningSun size={22} color={colors.primary} />
        <Text style={[styles.logoText, { color: colors.text }]}>mySun</Text>
      </View>

      {/* Center: Date */}
      <Text style={[styles.dateText, { color: colors.textSecondary }]}>{getShortDate()}</Text>

      {/* Right: Theme toggle */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleToggleTheme}
        style={[styles.themeBtn, { backgroundColor: colors.backgroundSecondary }]}
        accessibilityRole="button"
        accessibilityLabel={currentTheme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
      >
        <Text style={styles.themeBtnIcon}>{currentTheme === 'dark' ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.titleSm,
    letterSpacing: -0.3,
  },
  dateText: {
    fontFamily: theme.typography.fontFamilyHeading,
    fontSize: theme.typography.sizes.bodySm,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnIcon: {
    fontSize: 18,
  },
});
