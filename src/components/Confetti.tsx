import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiProps {
  active: boolean;
  onAnimationEnd?: () => void;
  duration?: number;
}

const COLORS = [
  '#FF8A7A', // Coral/Peach (Primary)
  '#A78BFA', // Lavender (Secondary)
  '#8ED6B1', // Sage mint (Success)
  '#FBBF24', // Warm yellow (Warning)
  '#60A5FA', // Soft blue (Info)
  '#EF4444', // Danger red
  '#EC4899', // Pink
  '#10B981', // Emerald
];

interface Particle {
  id: number;
  color: string;
  size: number;
  isRound: boolean;
  startX: number;
  animY: Animated.Value;
  animX: Animated.Value;
  animRotate: Animated.Value;
}

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  onAnimationEnd,
  duration = 3500,
}) => {
  const particlesRef = useRef<Particle[]>([]);

  // Create particles once
  if (particlesRef.current.length === 0) {
    const list: Particle[] = [];
    const count = Platform.OS === 'web' ? 60 : 40; // slightly fewer on native for performance

    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        color: COLORS[i % COLORS.length],
        size: Math.random() * 8 + 6,
        isRound: Math.random() > 0.5,
        startX: Math.random() * SCREEN_WIDTH,
        animY: new Animated.Value(-50),
        animX: new Animated.Value(0),
        animRotate: new Animated.Value(0),
      });
    }
    particlesRef.current = list;
  }

  useEffect(() => {
    if (!active) return;

    const animations = particlesRef.current.map((p) => {
      // Y fall animation
      const fallAnim = Animated.timing(p.animY, {
        toValue: SCREEN_HEIGHT + 50,
        duration: Math.random() * 1500 + duration - 1500,
        useNativeDriver: true,
      });

      // X sway animation
      const swayAnim = Animated.sequence([
        Animated.timing(p.animX, {
          toValue: Math.random() * 60 - 30,
          duration: Math.random() * 800 + 400,
          useNativeDriver: true,
        }),
        Animated.timing(p.animX, {
          toValue: Math.random() * 60 - 30,
          duration: Math.random() * 800 + 400,
          useNativeDriver: true,
        }),
        Animated.timing(p.animX, {
          toValue: Math.random() * 60 - 30,
          duration: Math.random() * 800 + 400,
          useNativeDriver: true,
        }),
      ]);

      // Rotation animation
      const rotateAnim = Animated.timing(p.animRotate, {
        toValue: 1,
        duration: Math.random() * 2000 + 1000,
        useNativeDriver: true,
      });

      return Animated.parallel([fallAnim, swayAnim, rotateAnim]);
    });

    // Run all animations in parallel
    Animated.parallel(animations).start(() => {
      if (onAnimationEnd) {
        onAnimationEnd();
      }
    });

    // Reset values on unmount or when active changes
    return () => {
      particlesRef.current.forEach((p) => {
        p.animY.setValue(-50);
        p.animX.setValue(0);
        p.animRotate.setValue(0);
      });
    };
  }, [active, duration, onAnimationEnd]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particlesRef.current.map((p) => {
        const rotateInterpolation = p.animRotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${Math.random() * 360 + 360}deg`],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                borderRadius: p.isRound ? p.size / 2 : 2,
                left: p.startX,
                transform: [
                  { translateY: p.animY },
                  { translateX: p.animX },
                  { rotate: rotateInterpolation },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    zIndex: 9999,
  },
});
