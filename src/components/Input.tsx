import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  onFocus,
  onBlur,
  editable = true,
  ...props
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;
  
  const [focused, setFocused] = useState(false);

  const handleFocus = (e: any) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error ? colors.danger : colors.textSecondary,
              fontSize: theme.typography.sizes.bodySm,
              fontWeight: theme.typography.weights.semibold,
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        editable={editable}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={colors.textSecondary + '70'}
        style={[
          styles.textInput,
          {
            backgroundColor: colors.background,
            borderColor: error
              ? colors.danger
              : focused
              ? colors.primary
              : colors.border,
            color: editable ? colors.text : colors.textSecondary,
            fontSize: theme.typography.sizes.body,
            borderRadius: theme.borderRadius.sm,
            paddingVertical: theme.spacing.sm + 2,
            paddingHorizontal: theme.spacing.md,
          },
          inputStyle,
        ]}
        {...props}
      />
      {error && (
        <Text
          style={[
            styles.errorText,
            {
              color: colors.danger,
              fontSize: theme.typography.sizes.caption,
              fontWeight: theme.typography.weights.medium,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    fontFamily: theme.typography.fontFamily,
    borderWidth: 1,
    minHeight: 44, // Touch target guideline
  },
  errorText: {
    fontFamily: theme.typography.fontFamily,
    marginTop: theme.spacing.xs,
    marginLeft: 2,
  },
});
