import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { theme } from '../../../constants/theme';
import { useWellnessStore } from '../../../store/useWellnessStore';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export const WaterReminderCard: React.FC = () => {
  const currentTheme = useWellnessStore((state) => state.theme);
  const colors = theme[currentTheme].colors;

  const settings = useWellnessStore((state) => state.waterReminderSettings);
  const updateSettings = useWellnessStore((state) => state.updateWaterReminderSettings);

  const adjustTime = (type: 'start' | 'end', amount: number) => {
    const timeStr = type === 'start' ? settings.startTime : settings.endTime;
    const [h, m] = timeStr.split(':').map(Number);
    
    // Adjust hour
    const newHour = (h + amount + 24) % 24;
    const formatted = `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    if (type === 'start') {
      updateSettings({ startTime: formatted });
    } else {
      updateSettings({ endTime: formatted });
    }
  };

  const handleToggleEnabled = (val: boolean) => {
    updateSettings({ enabled: val });
  };

  const handleSetInterval = (minutes: number) => {
    updateSettings({ intervalMinutes: minutes });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>🔔 Su Hatırlatıcıları</Text>
        <Switch
          value={settings.enabled}
          onValueChange={handleToggleEnabled}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {settings.enabled && (
        <View style={styles.settingsContent}>
          {/* Start Time Adjust */}
          <View style={styles.adjustBlock}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Başlangıç Saati</Text>
            <View style={styles.controlsRow}>
              <Button
                title="-"
                size="sm"
                variant="outline"
                style={styles.adjustBtn}
                onPress={() => adjustTime('start', -1)}
              />
              <Text style={[styles.timeText, { color: colors.text }]}>{settings.startTime}</Text>
              <Button
                title="+"
                size="sm"
                variant="outline"
                style={styles.adjustBtn}
                onPress={() => adjustTime('start', 1)}
              />
            </View>
          </View>

          {/* End Time Adjust */}
          <View style={styles.adjustBlock}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Bitiş Saati</Text>
            <View style={styles.controlsRow}>
              <Button
                title="-"
                size="sm"
                variant="outline"
                style={styles.adjustBtn}
                onPress={() => adjustTime('end', -1)}
              />
              <Text style={[styles.timeText, { color: colors.text }]}>{settings.endTime}</Text>
              <Button
                title="+"
                size="sm"
                variant="outline"
                style={styles.adjustBtn}
                onPress={() => adjustTime('end', 1)}
              />
            </View>
          </View>

          {/* Frequency/Interval */}
          <View style={styles.intervalBlock}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Hatırlatma Sıklığı</Text>
            <View style={styles.freqRow}>
              {[60, 120, 180].map((mins) => (
                <Button
                  key={mins}
                  title={`${mins / 60} sa`}
                  variant={settings.intervalMinutes === mins ? 'primary' : 'outline'}
                  size="sm"
                  style={styles.flexBtn}
                  onPress={() => handleSetInterval(mins)}
                />
              ))}
            </View>
          </View>
        </View>
      )}

      <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
        ℹ️ Bildirim sistemi sonraki güncellemede aktif olacak.
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.bold,
  },
  settingsContent: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  adjustBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timeText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
    width: 48,
    textAlign: 'center',
  },
  adjustBtn: {
    width: 36,
    minHeight: 36,
    paddingHorizontal: 0,
  },
  intervalBlock: {
    gap: theme.spacing.xs,
  },
  freqRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  flexBtn: {
    flex: 1,
  },
  noticeText: {
    fontSize: theme.typography.sizes.caption,
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
    lineHeight: 16,
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
