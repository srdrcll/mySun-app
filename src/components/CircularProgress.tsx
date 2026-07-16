import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';

interface CircularProgressProps {
  progress: number; // Value between 0 and 1
  size?: number; // Diameter
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  color,
  children,
  style,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const boundedProgress = isNaN(progress) ? 0 : Math.min(1, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = isNaN(boundedProgress) ? circumference : circumference - boundedProgress * circumference;
  
  const activeColor = color || colors.primary;
  const trackColor = colors.border;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          // Rotate start to top (-90 degrees)
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Centered Content overlay */}
      {children && <View style={styles.childContainer}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
