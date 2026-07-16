import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { SleepEntry } from '../../../types';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { formatSleepDuration } from '../utils/sleepHelpers';
import { getLocalDateString } from '../../../utils/date';

interface SleepLogModalProps {
  visible: boolean;
  onClose: () => void;
  entryToEdit?: SleepEntry;
}

export const SleepLogModal: React.FC<SleepLogModalProps> = ({
  visible,
  onClose,
  entryToEdit,
}) => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const defaultSleepTime = useWellnessStore((state) => state.sleepTime); // e.g. "23:00"
  const defaultWakeTime = useWellnessStore((state) => state.wakeUpTime); // e.g. "07:00"
  const addSleepEntry = useWellnessStore((state) => state.addSleepEntry);
  const updateSleepEntry = useWellnessStore((state) => state.updateSleepEntry);
  const hasSleepOverlap = useWellnessStore((state) => state.hasSleepOverlap);

  // Active Tab state: 'quick' or 'detail'
  const [activeTab, setActiveTab] = useState<'quick' | 'detail'>('quick');

  // Quick Input states
  const [quickHours, setQuickHours] = useState(8.0);
  const [quickDay, setQuickDay] = useState<'yesterday' | 'before'>('yesterday');

  // Detailed Input states
  const [sleepDateType, setSleepDateType] = useState<'yesterday' | 'today'>('yesterday');
  const [sleepHour, setSleepHour] = useState(23);
  const [sleepMinute, setSleepMinute] = useState(0);

  const [wakeDateType, setWakeDateType] = useState<'today' | 'tomorrow'>('today');
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(0);

  useEffect(() => {
    if (visible) {
      if (entryToEdit) {
        setActiveTab('detail');
        // Load existing values
        const sDate = new Date(entryToEdit.sleepTime);
        const wDate = new Date(entryToEdit.wakeTime);
        const todayStr = getLocalDateString(new Date());
        const sDateStr = getLocalDateString(sDate);
        const wDateStr = getLocalDateString(wDate);

        setSleepDateType(sDateStr === todayStr ? 'today' : 'yesterday');
        setSleepHour(sDate.getHours());
        setSleepMinute(sDate.getMinutes());

        setWakeDateType(wDateStr === todayStr ? 'today' : 'tomorrow');
        setWakeHour(wDate.getHours());
        setWakeMinute(wDate.getMinutes());
      } else {
        setActiveTab('quick');
        setQuickHours(8.0);
        setQuickDay('yesterday');
        // Use user settings defaults
        try {
          const [sH, sM] = defaultSleepTime.split(':').map(Number);
          setSleepHour(isNaN(sH) ? 23 : sH);
          setSleepMinute(isNaN(sM) ? 0 : sM);

          const [wH, wM] = defaultWakeTime.split(':').map(Number);
          setWakeHour(isNaN(wH) ? 7 : wH);
          setWakeMinute(isNaN(wM) ? 0 : wM);

          setSleepDateType('yesterday');
          setWakeDateType('today');
        } catch {
          setSleepHour(23);
          setSleepMinute(0);
          setWakeHour(7);
          setWakeMinute(0);
        }
      }
    }
  }, [visible, entryToEdit, defaultSleepTime, defaultWakeTime]);

  // Construct absolute dates based on inputs
  const getDates = () => {
    const today = new Date();
    
    if (activeTab === 'quick') {
      const [defaultWakeHour, defaultWakeMinute] = defaultWakeTime.split(':').map(Number);
      const wakeH = isNaN(defaultWakeHour) ? 7 : defaultWakeHour;
      const wakeM = isNaN(defaultWakeMinute) ? 0 : defaultWakeMinute;

      const wDate = new Date(today);
      if (quickDay === 'before') {
        wDate.setDate(today.getDate() - 1);
      }
      wDate.setHours(wakeH, wakeM, 0, 0);

      const sDate = new Date(wDate.getTime() - quickHours * 3600000);
      return { sDate, wDate };
    } else {
      const sDate = new Date(today);
      if (sleepDateType === 'yesterday') {
        sDate.setDate(today.getDate() - 1);
      }
      sDate.setHours(sleepHour, sleepMinute, 0, 0);

      const wDate = new Date(today);
      if (wakeDateType === 'tomorrow') {
        wDate.setDate(today.getDate() + 1);
      }
      wDate.setHours(wakeHour, wakeMinute, 0, 0);

      return { sDate, wDate };
    }
  };

  const { sDate, wDate } = getDates();
  const durationMinutes = Math.round((wDate.getTime() - sDate.getTime()) / 60000);

  // Form validations
  const isTimeValid = durationMinutes > 0;
  const isTooLong = durationMinutes > 1440; // Over 24 hours
  const isFuture = wDate.getTime() > Date.now() || sDate.getTime() > Date.now();
  
  const hasOverlap = hasSleepOverlap(
    sDate.toISOString(),
    wDate.toISOString(),
    entryToEdit?.id
  );

  let validationError = '';
  if (!isTimeValid) {
    validationError = '⚠️ Uyanma zamanı uyku başlangıcından sonra olmalıdır.';
  } else if (isTooLong) {
    validationError = '⚠️ Uyku süresi 24 saatten uzun olamaz.';
  } else if (isFuture) {
    validationError = '⚠️ Gelecekte bir uyku kaydı oluşturamazsınız.';
  } else if (hasOverlap) {
    validationError = '⚠️ Bu zaman aralığında başka bir uyku kaydınız bulunmaktadır.';
  }

  const handleAdjustTime = (
    type: 'sleep' | 'wake',
    unit: 'hour' | 'minute',
    amount: number
  ) => {
    if (type === 'sleep') {
      if (unit === 'hour') {
        setSleepHour((h) => (h + amount + 24) % 24);
      } else {
        setSleepMinute((m) => (m + amount + 60) % 60);
      }
    } else {
      if (unit === 'hour') {
        setWakeHour((h) => (h + amount + 24) % 24);
      } else {
        setWakeMinute((m) => (m + amount + 60) % 60);
      }
    }
  };

  const handleSave = () => {
    if (validationError) return;

    const sleepTimeIso = sDate.toISOString();
    const wakeTimeIso = wDate.toISOString();

    if (entryToEdit) {
      updateSleepEntry(entryToEdit.id, sleepTimeIso, wakeTimeIso);
    } else {
      addSleepEntry(sleepTimeIso, wakeTimeIso, 'manual');
    }

    onClose();
  };

  const handleAdjustQuickHours = (amount: number) => {
    setQuickHours((prev) => Math.min(16, Math.max(2, prev + amount)));
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={entryToEdit ? 'Uyku Kaydını Düzenle' : 'Uyku Kaydı Ekle'}
    >
      <View style={styles.content}>
        
        {/* TABS SELECTOR (Only when not editing an entry) */}
        {!entryToEdit && (
          <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.tabBtn,
                { borderBottomColor: activeTab === 'quick' ? colors.primary : 'transparent' },
              ]}
              onPress={() => setActiveTab('quick')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'quick' ? colors.primary : colors.textSecondary,
                    fontWeight: activeTab === 'quick' ? 'bold' : '600',
                  },
                ]}
              >
                Pratik Giriş ⚡
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.tabBtn,
                { borderBottomColor: activeTab === 'detail' ? colors.primary : 'transparent' },
              ]}
              onPress={() => setActiveTab('detail')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'detail' ? colors.primary : colors.textSecondary,
                    fontWeight: activeTab === 'detail' ? 'bold' : '600',
                  },
                ]}
              >
                Detaylı Giriş ⏰
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'quick' ? (
          /* PRATİK GİRİŞ (QUICK SLEEP HOURS COUNT) */
          <View style={[styles.sectionCard, { borderColor: colors.border, paddingVertical: theme.spacing.lg }]}>
            <Text style={[styles.quickSectionTitle, { color: colors.textSecondary }]}>
              Dün gece kaç saat uyudunuz? 😴
            </Text>

            <View style={styles.quickSelectorRow}>
              <Button
                title="-"
                size="md"
                variant="outline"
                style={styles.quickAdjustBtn}
                onPress={() => handleAdjustQuickHours(-0.5)}
              />
              <View style={styles.quickValueCol}>
                <Text style={[styles.quickValueText, { color: colors.text }]}>
                  {quickHours.toFixed(1)}
                </Text>
                <Text style={[styles.quickValueUnit, { color: colors.textSecondary }]}>Saat</Text>
              </View>
              <Button
                title="+"
                size="md"
                variant="outline"
                style={styles.quickAdjustBtn}
                onPress={() => handleAdjustQuickHours(0.5)}
              />
            </View>

            <View style={[styles.daysToggleRow, { marginTop: theme.spacing.md, paddingHorizontal: theme.spacing.sm }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.dayOption,
                  {
                    borderColor: quickDay === 'yesterday' ? colors.primary : colors.border,
                    backgroundColor: quickDay === 'yesterday' ? colors.primaryLight : 'transparent',
                  },
                ]}
                onPress={() => setQuickDay('yesterday')}
              >
                <Text style={{ color: quickDay === 'yesterday' ? colors.primary : colors.text, fontWeight: '700', fontSize: 11 }}>DÜN GECE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.dayOption,
                  {
                    borderColor: quickDay === 'before' ? colors.primary : colors.border,
                    backgroundColor: quickDay === 'before' ? colors.primaryLight : 'transparent',
                  },
                ]}
                onPress={() => setQuickDay('before')}
              >
                <Text style={{ color: quickDay === 'before' ? colors.primary : colors.text, fontWeight: '700', fontSize: 11 }}>ÖNCEKİ GECE</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* DETAYLI GİRİŞ (DETAILED CLOCK TIME PICKERS) */
          <>
            {/* SLEEP START CARD */}
            <View style={[styles.sectionCard, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>💤 Uyku Başlangıcı</Text>
              <View style={styles.daysToggleRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.dayOption,
                    {
                      borderColor: sleepDateType === 'yesterday' ? colors.primary : colors.border,
                      backgroundColor: sleepDateType === 'yesterday' ? colors.primaryLight : 'transparent',
                    },
                  ]}
                  onPress={() => setSleepDateType('yesterday')}
                >
                  <Text style={{ color: sleepDateType === 'yesterday' ? colors.primary : colors.text, fontWeight: '700', fontSize: 11 }}>DÜN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.dayOption,
                    {
                      borderColor: sleepDateType === 'today' ? colors.primary : colors.border,
                      backgroundColor: sleepDateType === 'today' ? colors.primaryLight : 'transparent',
                    },
                  ]}
                  onPress={() => setSleepDateType('today')}
                >
                  <Text style={{ color: sleepDateType === 'today' ? colors.primary : colors.text, fontWeight: '700', fontSize: 11 }}>BUGÜN</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.adjustRow}>
                <View style={styles.adjustCol}>
                  <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Saat</Text>
                  <View style={styles.controls}>
                    <Button title="-" size="sm" variant="outline" style={styles.adjBtn} onPress={() => handleAdjustTime('sleep', 'hour', -1)} />
                    <Text style={[styles.timeDisplay, { color: colors.text }]}>{String(sleepHour).padStart(2, '0')}</Text>
                    <Button title="+" size="sm" variant="outline" style={styles.adjBtn} onPress={() => handleAdjustTime('sleep', 'hour', 1)} />
                  </View>
                </View>

                <View style={styles.adjustCol}>
                  <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Dakika</Text>
                  <View style={styles.controls}>
                    <Button title="-" size="sm" variant="outline" style={styles.adjBtn} onPress={() => handleAdjustTime('sleep', 'minute', -15)} />
                    <Text style={[styles.timeDisplay, { color: colors.text }]}>{String(sleepMinute).padStart(2, '0')}</Text>
                    <Button title="+" size="sm" variant="outline" style={styles.adjBtn} onPress={() => handleAdjustTime('sleep', 'minute', 15)} />
                  </View>
                </View>
              </View>
            </View>

            {/* WAKE TIME CARD */}
            <View style={[styles.sectionCard, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>🌅 Uyanma Zamanı</Text>
              <View style={styles.daysToggleRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.dayOption,
                    {
                      borderColor: wakeDateType === 'today' ? colors.primary : colors.border,
                      backgroundColor: wakeDateType === 'today' ? colors.primaryLight : 'transparent',
                    },
                  ]}
                  onPress={() => setWakeDateType('today')}
                >
                  <Text style={{ color: wakeDateType === 'today' ? colors.primary : colors.text, fontWeight: '700', fontSize: 11 }}>BUGÜN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.dayOption,
                    {
                      borderColor: wakeDateType === 'tomorrow' ? colors.primary : colors.border,
                      backgroundColor: wakeDateType === 'tomorrow' ? colors.primaryLight : 'transparent',
                    },
                  ]}
                  onPress={() => setWakeDateType('tomorrow')}
                >
                  <Text style={{ color: wakeDateType === 'tomorrow' ? colors.primary : colors.text, fontWeight: '700', fontSize: 11 }}>YARIN</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.adjustRow}>
                <View style={styles.adjustCol}>
                  <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Saat</Text>
                  <View style={styles.controls}>
                    <Button title="-" size="sm" variant="outline" style={styles.adjBtn} onPress={() => handleAdjustTime('wake', 'hour', -1)} />
                    <Text style={[styles.timeDisplay, { color: colors.text }]}>{String(wakeHour).padStart(2, '0')}</Text>
                    <Button title="+" size="sm" variant="outline" style={styles.adjBtn} onPress={() => handleAdjustTime('wake', 'hour', 1)} />
                  </View>
                </View>

                <View style={styles.adjustCol}>
                  <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Dakika</Text>
                  <View style={styles.controls}>
                    <Button title="-" size="sm" variant="outline" style={styles.adjBtn} onPress={() => handleAdjustTime('wake', 'minute', -15)} />
                    <Text style={[styles.timeDisplay, { color: colors.text }]}>{String(wakeMinute).padStart(2, '0')}</Text>
                    <Button title="+" size="sm" variant="outline" style={styles.adjBtn} onPress={() => handleAdjustTime('wake', 'minute', 15)} />
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* DURATION PREVIEW / ERROR MESSAGES */}
        <View style={styles.feedbackArea}>
          {validationError ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>{validationError}</Text>
          ) : (
            <Text style={[styles.durationText, { color: colors.success }]}>
              ⏳ Toplam Uyku: <Text style={{ fontWeight: 'bold' }}>{formatSleepDuration(durationMinutes)}</Text>
            </Text>
          )}
        </View>

        {/* Actions Button Row */}
        <View style={styles.actionsRow}>
          <Button title="Vazgeç" variant="outline" style={styles.flexBtn} onPress={onClose} />
          <Button
            title="Kaydet"
            variant="primary"
            disabled={!!validationError}
            style={styles.flexBtn}
            onPress={handleSave}
          />
        </View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: theme.spacing.xs,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  daysToggleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  dayOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  adjustCol: {
    flex: 1,
    gap: 4,
  },
  adjustLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  adjBtn: {
    width: 36,
    minHeight: 36,
    paddingHorizontal: 0,
  },
  feedbackArea: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  durationText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  flexBtn: {
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: theme.spacing.md,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  tabText: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: theme.typography.sizes.bodySm,
  },
  quickSectionTitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.bodySm,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  quickSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  quickAdjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  quickValueCol: {
    alignItems: 'center',
    minWidth: 90,
  },
  quickValueText: {
    fontFamily: theme.typography.fontFamilyHeadingBold,
    fontSize: 36,
    lineHeight: 40,
  },
  quickValueUnit: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.caption,
  },
});
