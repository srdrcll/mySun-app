import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'flat' | 'highlight' | 'mint' | 'lavender';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const getCardStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: theme.borderRadius.md,
    };

    // Padding style
    let paddingVal = theme.spacing.md;
    if (padding === 'none') paddingVal = 0;
    else if (padding === 'sm') paddingVal = theme.spacing.sm;
    else if (padding === 'lg') paddingVal = theme.spacing.lg;

    const paddingStyle: ViewStyle = {
      padding: paddingVal,
    };

    // Variant style
    let variantStyle: ViewStyle = {};
    if (variant === 'default') {
      if (currentTheme === 'light') {
        variantStyle = {
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 2,
          borderWidth: 1,
          borderColor: colors.border,
        };
      } else {
        variantStyle = {
          borderWidth: 1,
          borderColor: colors.border,
        };
      }
    } else if (variant === 'flat') {
      variantStyle = {
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
      };
    } else if (variant === 'highlight') {
      variantStyle = {
        backgroundColor: colors.primaryLight,
        borderWidth: 1,
        borderColor: colors.border,
      };
    } else if (variant === 'mint') {
      variantStyle = {
        backgroundColor: colors.successLight,
        borderWidth: 1,
        borderColor: colors.border,
      };
    } else if (variant === 'lavender') {
      variantStyle = {
        backgroundColor: colors.secondaryLight,
        borderWidth: 1,
        borderColor: colors.border,
      };
    }

    return [baseStyle, paddingStyle, variantStyle, style as ViewStyle];
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={getCardStyle()}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={getCardStyle()}>{children}</View>;
};
