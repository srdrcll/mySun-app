import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Keyboard,
  Alert,
} from 'react-native';
import { theme } from '../constants/theme';
import { useWellnessStore } from '../store/useWellnessStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { CircularProgress } from '../components/CircularProgress';
import { SectionHeader } from '../components/SectionHeader';
import { getLocalDateString } from '../utils/date';

// Water Feature Subcomponents
import { TodayWaterList } from '../features/water/components/TodayWaterList';
import { WaterHistoryList } from '../features/water/components/WaterHistoryList';
import { WaterReminderCard } from '../features/water/components/WaterReminderCard';

interface WaterTrackingScreenProps {
  onBack: () => void;
}

export const WaterTrackingScreen: React.FC<WaterTrackingScreenProps> = ({ onBack }) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  // Store variables
  const waterTarget = useWellnessStore((state) => state.waterTarget);
  const setWaterTarget = useWellnessStore((state) => state.setWaterTarget);
  const history = useWellnessStore((state) => state.history);
  const addWaterEntry = useWellnessStore((state) => state.addWaterEntry);
  const undoLastWaterEntry = useWellnessStore((state) => state.undoLastWaterEntry);

  const todayKey = getLocalDateString();
  const todayRecord = history[todayKey] || { water: 0, waterEntries: [] };
  const currentWater = todayRecord.waterEntries
    ? todayRecord.waterEntries.reduce((sum, e) => sum + e.amount, 0)
    : todayRecord.water || 0;

  const percentage = Math.min(100, Math.round((currentWater / waterTarget) * 100));
  const isTargetAchieved = currentWater >= waterTarget;

  // Local state for modals
  const [customWaterModal, setCustomWaterModal] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customWaterText, setCustomWaterText] = useState('');
  
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalText, setGoalText] = useState(waterTarget.toString());

  // Local state for Undo banner
  const [undoVisible, setUndoVisible] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (undoTimer) clearTimeout(undoTimer);
    };
  }, [undoTimer]);

  const triggerUndoBanner = (amount: number) => {
    // Cancel existing timer
    if (undoTimer) clearTimeout(undoTimer);
    
    setUndoMessage(`${amount} ml eklendi`);
    setUndoVisible(true);

    // Hide after 5 seconds
    const timer = setTimeout(() => {
      setUndoVisible(false);
    }, 5000);
    setUndoTimer(timer);
  };

  const handleAddWater = (amount: number) => {
    // Validation on large entries
    if (amount > 5000) {
      Alert.alert(
        'Yüksek Miktar',
        'Bu miktar oldukça yüksek görünüyor. Yine de eklemek istiyor musun?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Ekle',
            onPress: () => {
              addWaterEntry(amount);
              triggerUndoBanner(amount);
              setCustomWaterModal(false);
              setShowCustomInput(false);
              setCustomWaterText('');
            },
          },
        ]
      );
    } else {
      addWaterEntry(amount);
      triggerUndoBanner(amount);
      setCustomWaterModal(false);
      setShowCustomInput(false);
      setCustomWaterText('');
    }
  };

  const handleAddCustomWater = () => {
    const amount = parseInt(customWaterText);
    if (!isNaN(amount) && amount > 0) {
      handleAddWater(amount);
      Keyboard.dismiss();
    }
  };

  const handleUndo = () => {
    undoLastWaterEntry(todayKey);
    setUndoVisible(false);
    
    // Quick success feedback
    Alert.alert('Geri Alındı', 'Son eklenen su kaydı başarıyla iptal edildi. 💧');
  };

  const handleUpdateGoal = () => {
    const newGoal = parseInt(goalText);
    if (!isNaN(newGoal) && newGoal >= 500) {
      setWaterTarget(newGoal);
      setGoalModalVisible(false);
    } else {
      Alert.alert('Hata', 'Su hedefi en az 500 ml olmalıdır.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Top Header Row */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Text style={[styles.backBtnText, { color: colors.text }]}>← Geri</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Su Takibi</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Visual Progress Section */}
        <Card style={styles.progressCard}>
          <Text style={[styles.todayText, { color: colors.textSecondary }]}>Bugünkü Durum</Text>
          <View style={styles.progressCircleContainer}>
            <CircularProgress
              progress={currentWater / waterTarget}
              size={150}
              strokeWidth={12}
              color={colors.info}
            >
              <Text style={[styles.percentageText, { color: colors.text }]}>{percentage}%</Text>
              <Text style={[styles.mlText, { color: colors.textSecondary }]}>tamamlandı</Text>
            </CircularProgress>
          </View>

          <View style={styles.amountDisplayRow}>
            <Text style={[styles.amountVal, { color: colors.text }]}>
              {currentWater} <Text style={[styles.unit, { color: colors.textSecondary }]}>/ {waterTarget} ml</Text>
            </Text>
          </View>

          {isTargetAchieved ? (
            <View style={[styles.badge, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>Hedefine ulaştın 🎉</Text>
            </View>
          ) : (
            <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
              Hedefine ulaşmak için {Math.max(0, waterTarget - currentWater)} ml daha içmelisin.
            </Text>
          )}

          <Button
            title="Hedefi Düzenle"
            variant="outline"
            size="sm"
            style={styles.editGoalBtn}
            onPress={() => {
              setGoalText(waterTarget.toString());
              setGoalModalVisible(true);
            }}
          />
        </Card>

        {/* Quick Add Buttons Card */}
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Su Ekle</Text>
          <View style={styles.quickAddRow}>
            <Button
              title="+250 ml"
              variant="outline"
              size="md"
              style={styles.flexBtn}
              onPress={() => handleAddWater(250)}
            />
            <Button
              title="+500 ml"
              variant="outline"
              size="md"
              style={styles.flexBtn}
              onPress={() => handleAddWater(500)}
            />
            <Button
              title="Özel Miktar"
              variant="secondary"
              size="md"
              style={styles.flexBtn}
              onPress={() => setCustomWaterModal(true)}
            />
          </View>
        </Card>

        {/* 5. Bugünün Kayıtları */}
        <SectionHeader title="Bugünkü Kayıtlar 💧" />
        <TodayWaterList dateKey={todayKey} />

        {/* 13. Hatırlatıcı Ayarları Panel */}
        <WaterReminderCard />

        {/* 11. Son 7 Günlük Geçmiş */}
        <WaterHistoryList />

      </ScrollView>

      {/* Floating Undo Banner */}
      {undoVisible && (
        <View style={[styles.undoBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.undoText, { color: colors.text }]}>{undoMessage}</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.undoAction} onPress={handleUndo}>
            <Text style={[styles.undoActionText, { color: colors.primary }]}>GERİ AL</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CUSTOM WATER INPUT MODAL */}
      <Modal
        visible={customWaterModal}
        onClose={() => {
          setCustomWaterModal(false);
          setShowCustomInput(false);
          setCustomWaterText('');
        }}
        title="Su Ekle"
      >
        <View style={styles.modalContent}>
          {!showCustomInput ? (
            <View style={styles.presetCol}>
              <Button title="+250 ml (Bardak)" variant="outline" style={styles.presetBtn} onPress={() => handleAddWater(250)} />
              <Button title="+500 ml (Şişe)" variant="outline" style={styles.presetBtn} onPress={() => handleAddWater(500)} />
              <Button title="Özel Miktar Yaz" variant="secondary" style={styles.presetBtn} onPress={() => setShowCustomInput(true)} />
            </View>
          ) : (
            <View style={styles.customInputCol}>
              <Input
                label="Su Miktarı (ml)"
                placeholder="Örn: 330, 450..."
                keyboardType="numeric"
                value={customWaterText}
                onChangeText={setCustomWaterText}
                autoFocus
              />
              <View style={styles.customButtonsRow}>
                <Button
                  title="Geri"
                  variant="outline"
                  style={styles.flexBtn}
                  onPress={() => {
                    setShowCustomInput(false);
                    setCustomWaterText('');
                  }}
                />
                <Button
                  title="Ekle"
                  variant="primary"
                  style={styles.flexBtn}
                  disabled={!customWaterText.trim() || isNaN(parseInt(customWaterText)) || parseInt(customWaterText) <= 0}
                  onPress={handleAddCustomWater}
                />
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* EDIT TARGET GOAL MODAL */}
      <Modal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        title="Günlük Su Hedefi"
      >
        <View style={styles.modalContent}>
          <Input
            label="Günlük Hedef (ml)"
            placeholder="Örn: 2000"
            keyboardType="numeric"
            value={goalText}
            onChangeText={setGoalText}
            autoFocus
          />
          
          {/* Preset goals */}
          <View style={styles.presetGoalRow}>
            {[1500, 2000, 2500, 3000].map((preset) => (
              <Button
                key={preset}
                title={`${preset} ml`}
                variant={parseInt(goalText) === preset ? 'primary' : 'outline'}
                size="sm"
                style={styles.presetBtnGoal}
                onPress={() => setGoalText(preset.toString())}
              />
            ))}
          </View>

          <View style={styles.customButtonsRow}>
            <Button
              title="Vazgeç"
              variant="outline"
              style={styles.flexBtn}
              onPress={() => setGoalModalVisible(false)}
            />
            <Button
              title="Güncelle"
              variant="primary"
              style={styles.flexBtn}
              disabled={!goalText.trim() || isNaN(parseInt(goalText)) || parseInt(goalText) < 500}
              onPress={handleUpdateGoal}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
  },
  backBtnText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.titleSm,
    fontWeight: 'bold',
  },
  backBtnPlaceholder: {
    width: 60,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 60,
  },
  progressCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  todayText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  progressCircleContainer: {
    marginVertical: theme.spacing.md,
  },
  percentageText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  mlText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  amountVal: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'normal',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
  },
  badgeText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  remainingText: {
    fontSize: theme.typography.sizes.bodySm,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  editGoalBtn: {
    width: 'auto',
    minWidth: 150,
    minHeight: 36,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  flexBtn: {
    flex: 1,
  },
  undoBanner: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    left: theme.spacing.md,
    right: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  undoText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  undoAction: {
    padding: 4,
  },
  undoActionText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: 'bold',
  },
  modalContent: {
    paddingVertical: theme.spacing.xs,
  },
  presetCol: {
    gap: theme.spacing.sm,
  },
  presetBtn: {
    width: '100%',
  },
  customInputCol: {
    width: '100%',
  },
  customButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  presetGoalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginVertical: theme.spacing.sm,
  },
  presetBtnGoal: {
    flex: 1,
    minWidth: 70,
    minHeight: 36,
    paddingHorizontal: 0,
  },
});
