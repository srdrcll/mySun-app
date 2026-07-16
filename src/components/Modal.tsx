import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  contentContainerStyle,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  return (
    <RNModal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                },
                contentContainerStyle,
              ]}
            >
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
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
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <Text style={[styles.closeText, { color: colors.textSecondary }]}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.body}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 42, 38, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
      },
      android: {
        elevation: 10,
      },
    }),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: theme.typography.fontFamily,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 28,
  },
  body: {
    padding: theme.spacing.md,
  },
});
