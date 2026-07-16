import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';

interface ProgressBarProps {
  progress: number; // Value between 0 and 1
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 8,
  style,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const boundedProgress = Math.min(1, Math.max(0, progress));
  const activeColor = color || colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: colors.border,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${boundedProgress * 100}%`,
            height: '100%',
            backgroundColor: activeColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
