import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';

interface BottomNavBarProps {
  currentScreen: 'dashboard' | 'calendar' | 'profile';
  onChangeScreen: (screen: 'dashboard' | 'calendar' | 'profile') => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentScreen,
  onChangeScreen,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const tabs = [
    {
      id: 'dashboard' as const,
      label: 'Ana Sayfa',
      icon: '🏠',
      accessibilityLabel: 'Ana Sayfa sekmesi',
    },
    {
      id: 'calendar' as const,
      label: 'Takvim',
      icon: '📅',
      accessibilityLabel: 'Takvim sekmesi',
    },
    {
      id: 'profile' as const,
      label: 'Profil',
      icon: '👤',
      accessibilityLabel: 'Profil ve Ayarlar sekmesi',
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          shadowColor: '#000',
        },
      ]}
    >
      {tabs.map((t) => {
        const isActive = currentScreen === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={t.accessibilityLabel}
            accessibilityState={{ selected: isActive }}
            style={styles.tabBtn}
            onPress={() => onChangeScreen(t.id)}
          >
            <Text style={[styles.icon, { opacity: isActive ? 1 : 0.5 }]}>{t.icon}</Text>
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.primary : colors.textSecondary,
                  fontWeight: isActive ? 'bold' : '600',
                },
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 76 : 60,
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 9,
    textTransform: 'uppercase',
  },
});
