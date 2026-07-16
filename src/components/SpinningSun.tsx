import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

interface SpinningSunProps {
  size?: number;
  color?: string;
}

export const SpinningSun: React.FC<SpinningSunProps> = ({
  size = 22,
  color = '#FF8A7A',
}) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [rotation]);

  const spinStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
    width: size,
    height: size,
  };

  const cx = size / 2;
  const cy = size / 2;

  // Scale all dimensions relative to size
  const coreR      = size * 0.25;   // radius of the ring circle
  const strokeW    = size * 0.09;   // stroke width
  const rayStart   = size * 0.38;   // where each ray line starts (from center)
  const rayEnd     = size * 0.48;   // where each ray line ends (from center)
  const numRays    = 8;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Build 8 ray line endpoints
  const rays = Array.from({ length: numRays }, (_, i) => {
    const angle = toRad((360 / numRays) * i);
    return {
      x1: cx + rayStart * Math.cos(angle),
      y1: cy + rayStart * Math.sin(angle),
      x2: cx + rayEnd   * Math.cos(angle),
      y2: cy + rayEnd   * Math.sin(angle),
    };
  });

  return (
    <Animated.View style={spinStyle}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Center ring — outline only, no fill */}
        <Circle
          cx={cx}
          cy={cy}
          r={coreR}
          stroke={color}
          strokeWidth={strokeW}
          fill="none"
        />
        {/* 8 short dash rays */}
        {rays.map((ray, i) => (
          <Line
            key={i}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        ))}
      </Svg>
    </Animated.View>
  );
};
