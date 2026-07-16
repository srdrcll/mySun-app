import { Audio } from 'expo-av';

let isWaterLoading = false;
let isDingLoading = false;

/**
 * Sound Service to handle audio playback for micro-interactions.
 * Catches errors safely to prevent app crashes on Web or Native systems.
 */

export const playWaterSound = async (): Promise<void> => {
  if (isWaterLoading) return;
  isWaterLoading = true;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../../assets/sounds/water_drop.mp3'),
      { shouldPlay: true }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[soundService] Failed to play water drop sound:', error);
    }
  } finally {
    isWaterLoading = false;
  }
};

export const playDingSound = async (): Promise<void> => {
  if (isDingLoading) return;
  isDingLoading = true;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../../assets/sounds/ding.wav'),
      { shouldPlay: true }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[soundService] Failed to play ding chime sound:', error);
    }
  } finally {
    isDingLoading = false;
  }
};
