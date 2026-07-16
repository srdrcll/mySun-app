import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string; // Emoji character as symbol
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🌱',
  title,
  description,
  actionTitle,
  onActionPress,
  style,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontSize: theme.typography.sizes.titleSm,
            fontWeight: theme.typography.weights.bold,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: colors.textSecondary,
            fontSize: theme.typography.sizes.bodySm,
          },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant="secondary"
          size="sm"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
  },
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  title: {
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  button: {
    width: 'auto',
    minWidth: 150,
  },
});
