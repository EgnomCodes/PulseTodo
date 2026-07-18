import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { colors } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, notes: string, deadline: Date | null) => void;
};

export function AddTodoModal({ visible, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const reset = () => {
    setTitle('');
    setNotes('');
    setDeadline(null);
    setShowPicker(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave(title, notes, deadline);
    reset();
    onClose();
  };

  const onChangeDate = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed') return;
    }
    if (date) setDeadline(date);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>New todo</Text>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What needs doing?"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            autoFocus
          />
          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional details"
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, styles.notes]}
            multiline
          />
          <Text style={styles.label}>Deadline</Text>
          <View style={styles.row}>
            <Pressable
              style={styles.chip}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.chipText}>
                {deadline
                  ? deadline.toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Set deadline'}
              </Text>
            </Pressable>
            {deadline ? (
              <Pressable style={styles.chipGhost} onPress={() => setDeadline(null)}>
                <Text style={styles.chipGhostText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {showPicker ? (
            <DateTimePicker
              value={deadline ?? new Date(Date.now() + 60 * 60 * 1000)}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
              themeVariant="dark"
            />
          ) : null}

          {Platform.OS === 'ios' && showPicker ? (
            <Pressable style={styles.chipGhost} onPress={() => setShowPicker(false)}>
              <Text style={styles.chipGhostText}>Done choosing date</Text>
            </Pressable>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={styles.btnGhost} onPress={handleClose}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, !canSave && styles.btnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={styles.btnPrimaryText}>Add</Text>
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
    marginBottom: 16,
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
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  notes: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: colors.bgSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: {
    color: colors.ink,
    fontWeight: '600',
  },
  chipGhost: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipGhostText: {
    color: colors.accentSoft,
    fontWeight: '600',
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
    opacity: 0.4,
  },
  btnPrimaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
