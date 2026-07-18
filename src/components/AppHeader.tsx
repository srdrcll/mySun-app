import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { SpinningSun } from './SpinningSun';

// Micro-interaction animated icon for theme toggle button
const AnimatedThemeIcon: React.FC<{ themeMode: 'light' | 'dark'; color: string }> = ({ themeMode, color }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animValue.setValue(0);
    if (themeMode === 'dark') {
      // Sun: Continuous rotation matching the logo sun
      const spin = Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    } else {
      // Moon: Continuous single loop for maximum web compatibility, sways and floats
      const float = Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      float.start();
      return () => float.stop();
    }
  }, [themeMode, animValue]);

  if (themeMode === 'dark') {
    const spin = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    return (
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Feather name="sun" size={18} color={color} />
      </Animated.View>
    );
  } else {
    // We map [0 -> 0.5 -> 1] to make the moon float up and return down smoothly
    const translateY = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, -3.5, 0],
    });
    // We map [0 -> 0.25 -> 0.5 -> 0.75 -> 1] to make it sway left, return, sway right, return
    const rotate = animValue.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: ['0deg', '-8deg', '0deg', '8deg', '0deg'],
    });
    return (
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <Feather name="moon" size={17} color={color} />
      </Animated.View>
    );
  }
};

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
        <AnimatedThemeIcon themeMode={currentTheme} color={colors.primary} />
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
