import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  StyleProp,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'text';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const getButtonStyle = (): StyleProp<ViewStyle> => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      borderRadius: theme.borderRadius.sm,
    };

    // Variant style
    let variantStyle: ViewStyle = {};
    switch (variant) {
      case 'primary':
        variantStyle = {
          backgroundColor: colors.primary,
        };
        break;
      case 'secondary':
        variantStyle = {
          backgroundColor: colors.secondaryLight,
        };
        break;
      case 'outline':
        variantStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.border,
        };
        break;
      case 'danger':
        variantStyle = {
          backgroundColor: colors.danger,
        };
        break;
      case 'text':
        variantStyle = {
          backgroundColor: 'transparent',
          paddingHorizontal: 0,
          minHeight: 36,
        };
        break;
    }

    // Size style
    let sizeStyle: ViewStyle = {};
    switch (size) {
      case 'sm':
        sizeStyle = {
          minHeight: 36,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
        };
        break;
      case 'md':
        sizeStyle = {
          minHeight: 48, // Touch target guideline
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        };
        break;
      case 'lg':
        sizeStyle = {
          minHeight: 56,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.borderRadius.md,
        };
        break;
    }

    // Disabled state
    let disabledStyle: ViewStyle = {};
    if (disabled || loading) {
      disabledStyle = {
        opacity: 0.5,
      };
    }

    return [baseStyle, variantStyle, sizeStyle, disabledStyle, style];
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    const baseStyle: TextStyle = {
      fontFamily: theme.typography.fontFamily,
      fontWeight: theme.typography.weights.semibold,
      textAlign: 'center',
    };

    // Variant text color
    let variantTextStyle: TextStyle = {};
    switch (variant) {
      case 'primary':
      case 'danger':
        variantTextStyle = { color: '#FFFFFF' };
        break;
      case 'secondary':
        variantTextStyle = { color: colors.secondary };
        break;
      case 'outline':
      case 'text':
        variantTextStyle = { color: colors.text };
        break;
    }

    // Size text
    let sizeTextStyle: TextStyle = {};
    switch (size) {
      case 'sm':
        sizeTextStyle = { fontSize: theme.typography.sizes.bodySm };
        break;
      case 'md':
        sizeTextStyle = { fontSize: theme.typography.sizes.body };
        break;
      case 'lg':
        sizeTextStyle = { fontSize: theme.typography.sizes.titleSm };
        break;
    }

    return [baseStyle, variantTextStyle, sizeTextStyle, textStyle];
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={getButtonStyle()}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
