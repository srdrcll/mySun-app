import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';

import { useWellnessStore } from './src/store/useWellnessStore';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { setupAndroidNotificationChannel } from './src/services/notifications/notificationService';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { WaterTrackingScreen } from './src/screens/WaterTrackingScreen';
import { HabitsScreen } from './src/screens/HabitsScreen';
import { MoodTrackingScreen } from './src/screens/MoodTrackingScreen';
import { SleepTrackingScreen } from './src/screens/SleepTrackingScreen';
import { StatisticsScreen } from './src/screens/StatisticsScreen';
import { SeninIcinScreen } from './src/screens/SeninIcinScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BottomNavBar } from './src/components/BottomNavBar';

// ─── Inner App (needs store access) ──────────────────────────────────────────

function AppInner() {
  const isOnboarded = useWellnessStore((state) => state.isOnboarded);
  const trackAppOpen = useWellnessStore((state) => state.trackAppOpen);
  const currentTheme = useWellnessStore((state) => state.theme);

  const [currentScreen, setCurrentScreen] = useState<
    'dashboard' | 'water' | 'habits' | 'mood' | 'sleep' | 'statistics' | 'senin-icin' | 'calendar' | 'profile'
  >('dashboard');
  const [hydrated, setHydrated] = useState(false);

  // ── Load Google Fonts
  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  // ── Hydration guard: wait for AsyncStorage → Zustand to finish
  useEffect(() => {
    if (useWellnessStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    const unsub = useWellnessStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // One-time Android notification channel setup
    setupAndroidNotificationChannel();
    return unsub;
  }, []);

  // ── Track unique app-open days after hydration
  useEffect(() => {
    if (hydrated && isOnboarded) {
      trackAppOpen();
    }
  }, [hydrated, isOnboarded]);

  // ── Splash/Loading: until store hydration and fonts complete
  if (!hydrated || !fontsLoaded) {
    const bgColor = currentTheme === 'dark' ? '#121110' : '#FCFBF7';
    const spinColor = '#FF8A7A';
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={spinColor} />
      </View>
    );
  }

  // ── Onboarding
  if (!isOnboarded) {
    return <OnboardingScreen />;
  }

  // ── Full-screen detail routes
  if (currentScreen === 'water')      return <WaterTrackingScreen onBack={() => setCurrentScreen('dashboard')} />;
  if (currentScreen === 'habits')     return <HabitsScreen onBack={() => setCurrentScreen('dashboard')} />;
  if (currentScreen === 'mood')       return <MoodTrackingScreen onBack={() => setCurrentScreen('dashboard')} />;
  if (currentScreen === 'sleep')      return <SleepTrackingScreen onBack={() => setCurrentScreen('dashboard')} />;
  if (currentScreen === 'senin-icin') return <SeninIcinScreen onBack={() => setCurrentScreen('dashboard')} />;

  // ── Tab screens (with bottom nav)
  const isTabScreen =
    currentScreen === 'dashboard' ||
    currentScreen === 'calendar'  ||
    currentScreen === 'statistics' ||
    currentScreen === 'profile';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onWaterCardPress={() => setCurrentScreen('water')}
            onHabitsCardPress={() => setCurrentScreen('habits')}
            onMoodCardPress={() => setCurrentScreen('mood')}
            onSleepCardPress={() => setCurrentScreen('sleep')}
            onDailyMessageCardPress={() => setCurrentScreen('senin-icin')}
          />
        )}
        {currentScreen === 'calendar'   && <CalendarScreen />}
        {currentScreen === 'statistics' && <StatisticsScreen onBack={() => setCurrentScreen('profile')} />}
        {currentScreen === 'profile'    && (
          <ProfileScreen onNavigateToStats={() => setCurrentScreen('statistics')} />
        )}
      </View>

      {isTabScreen && (
        <BottomNavBar
          currentScreen={currentScreen === 'statistics' ? 'profile' : currentScreen}
          onChangeScreen={(screen) => setCurrentScreen(screen)}
        />
      )}
    </View>
  );
}

// ─── Root (wraps everything in ErrorBoundary) ─────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
