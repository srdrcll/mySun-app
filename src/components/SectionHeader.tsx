import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';

interface SectionHeaderProps {
  title: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionTitle,
  onActionPress,
  style,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  return (
    <View style={[styles.container, style]}>
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
      {actionTitle && onActionPress && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onActionPress}
          style={styles.actionContainer}
        >
          <Text
            style={[
              styles.actionText,
              {
                color: colors.primary,
                fontSize: theme.typography.sizes.bodySm,
                fontWeight: theme.typography.weights.semibold,
              },
            ]}
          >
            {actionTitle}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: theme.typography.fontFamilyHeading,
  },
  actionContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontFamily: theme.typography.fontFamily,
  },
});
