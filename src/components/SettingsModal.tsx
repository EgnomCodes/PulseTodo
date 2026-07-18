import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppSettings } from '../types';
import { colors } from '../theme';
import {
  getPermissionSnapshot,
  openSystemNotificationSettings,
  sendTestNotification,
  type PermissionSnapshot,
} from '../notifications';

type Props = {
  visible: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (next: AppSettings) => void;
};

export function SettingsModal({ visible, settings, onClose, onSave }: Props) {
  const [intervalMinutes, setIntervalMinutes] = useState(String(settings.intervalMinutes));
  const [remindersEnabled, setRemindersEnabled] = useState(settings.remindersEnabled);
  const [snap, setSnap] = useState<PermissionSnapshot | null>(null);
  const [testBusy, setTestBusy] = useState(false);

  const syncFromProps = () => {
    setIntervalMinutes(String(settings.intervalMinutes));
    setRemindersEnabled(settings.remindersEnabled);
    getPermissionSnapshot()
      .then(setSnap)
      .catch(() => setSnap(null));
  };

  const onTest = async () => {
    setTestBusy(true);
    try {
      const msg = await sendTestNotification();
      const next = await getPermissionSnapshot();
      setSnap(next);
      Alert.alert('Test notification', msg);
    } catch (e) {
      Alert.alert('Test failed', e instanceof Error ? e.message : String(e));
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onShow={syncFromProps}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>Pulse settings</Text>
          <Text style={styles.help}>
            Every X minutes you get a banner while using other apps. Tap it to open this
            list. Use Test first to confirm iOS allows notifications.
          </Text>

          <Text style={styles.status}>
            Permission: {snap?.status ?? '…'}
            {'\n'}
            Queued pulses: {snap?.scheduledCount ?? '…'}
          </Text>

          {!snap?.granted ? (
            <Pressable style={styles.linkBtn} onPress={() => openSystemNotificationSettings()}>
              <Text style={styles.linkBtnText}>Open iOS notification settings</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[styles.testBtn, testBusy && styles.btnDisabled]}
            onPress={onTest}
            disabled={testBusy}
          >
            <Text style={styles.testBtnText}>
              {testBusy ? 'Scheduling…' : 'Send test notification (5s)'}
            </Text>
          </Pressable>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Reminders on</Text>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: colors.line, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>

          <Text style={styles.label}>Interval (minutes)</Text>
          <TextInput
            value={intervalMinutes}
            onChangeText={setIntervalMinutes}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="15"
            placeholderTextColor={colors.inkMuted}
          />
          <View style={styles.presets}>
            {[1, 5, 10, 15, 30, 60].map((m) => (
              <Pressable
                key={m}
                style={[
                  styles.preset,
                  intervalMinutes === String(m) && styles.presetActive,
                ]}
                onPress={() => setIntervalMinutes(String(m))}
              >
                <Text
                  style={[
                    styles.presetText,
                    intervalMinutes === String(m) && styles.presetTextActive,
                  ]}
                >
                  {m}m
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.btnGhost} onPress={onClose}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.btnPrimary}
              onPress={() => {
                const mins = Math.max(1, Math.min(1440, parseInt(intervalMinutes, 10) || 15));
                onSave({
                  intervalMinutes: mins,
                  remindersEnabled,
                });
                onClose();
              }}
            >
              <Text style={styles.btnPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  heading: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  help: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  status: {
    color: colors.accentSoft,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  linkBtn: {
    marginBottom: 10,
  },
  linkBtnText: {
    color: colors.warn,
    fontWeight: '700',
    fontSize: 14,
  },
  testBtn: {
    backgroundColor: colors.bgSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  testBtnText: {
    color: colors.accentSoft,
    fontWeight: '700',
    fontSize: 15,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    color: colors.inkMuted,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.bgSoft,
    color: colors.ink,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.line,
    fontWeight: '600',
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  preset: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgSoft,
  },
  presetActive: {
    borderColor: colors.accent,
    backgroundColor: '#1A3F34',
  },
  presetText: {
    color: colors.inkMuted,
    fontWeight: '600',
  },
  presetTextActive: {
    color: colors.accentSoft,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 22,
  },
  btnGhost: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnGhostText: {
    color: colors.inkMuted,
    fontWeight: '600',
    fontSize: 16,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPrimaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
