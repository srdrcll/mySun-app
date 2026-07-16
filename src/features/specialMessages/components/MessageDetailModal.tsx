import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { SpecialMessage } from '../../../types';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { replacePlaceholders } from '../utils/messageHelpers';

interface MessageDetailModalProps {
  visible: boolean;
  onClose: () => void;
  message?: SpecialMessage;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  visible,
  onClose,
  message,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const username = useWellnessStore((state) => state.username);
  const favoriteIds = useWellnessStore((state) => state.favoriteMessageIds);
  
  // Actions
  const markMessageAsRead = useWellnessStore((state) => state.markMessageAsRead);
  const toggleFavoriteMessage = useWellnessStore((state) => state.toggleFavoriteMessage);

  useEffect(() => {
    if (visible && message) {
      markMessageAsRead(message.id);
    }
  }, [visible, message]);

  if (!message) return null;

  const isFavorite = favoriteIds.includes(message.id);
  const formattedContent = replacePlaceholders(message.content, username);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={message.title || 'Mektup'}
    >
      <View style={styles.content}>
        
        {/* Letter Page Layout */}
        <View style={[styles.letterContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Text style={[styles.letterText, { color: colors.text }]}>
            {formattedContent}
          </Text>
        </View>

        {/* Bottom Actions Row */}
        <View style={styles.actionsRow}>
          {/* Favorite Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.favBtn,
              {
                borderColor: isFavorite ? '#EF4444' : colors.border,
                backgroundColor: isFavorite ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
              },
            ]}
            onPress={() => toggleFavoriteMessage(message.id)}
            accessibilityRole="button"
            accessibilityLabel="Favorilere ekle/çıkar"
            accessibilityState={{ selected: isFavorite }}
          >
            <Text style={[styles.favHeart, { color: isFavorite ? '#EF4444' : colors.textSecondary }]}>
              {isFavorite ? '♥︎' : '♡'}
            </Text>
            <Text style={[styles.favLabel, { color: isFavorite ? '#EF4444' : colors.text }]}>
              {isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
            </Text>
          </TouchableOpacity>

          {/* Close Button */}
          <Button title="Kapat" variant="outline" style={styles.closeBtn} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: theme.spacing.xs,
  },
  letterContainer: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    minHeight: 140,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  letterText: {
    fontSize: theme.typography.sizes.body,
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  authorText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  favBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
    height: 48,
  },
  favHeart: {
    fontSize: 22,
    lineHeight: 24,
  },
  favLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  closeBtn: {
    flex: 1,
  },
});
