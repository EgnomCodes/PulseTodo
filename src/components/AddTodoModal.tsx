import React, { useMemo, useRef, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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

const KEYBOARD_ACCESSORY_ID = 'pulsetodo-add-todo-accessory';

export function AddTodoModal({ visible, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const titleRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const reset = () => {
    setTitle('');
    setNotes('');
    setDeadline(null);
    setShowPicker(false);
  };

  const dismissKeyboard = () => {
    titleRef.current?.blur();
    notesRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleClose = () => {
    dismissKeyboard();
    reset();
    onClose();
  };

  const handleSave = () => {
    if (!canSave) return;
    dismissKeyboard();
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <Pressable style={styles.backdrop} onPress={dismissKeyboard}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.heading}>New todo</Text>

              <Text style={styles.label}>Title</Text>
              <TextInput
                ref={titleRef}
                value={title}
                onChangeText={setTitle}
                placeholder="What needs doing?"
                placeholderTextColor={colors.inkMuted}
                style={styles.input}
                autoFocus
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={dismissKeyboard}
                inputAccessoryViewID={
                  Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined
                }
              />

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                ref={notesRef}
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional details — tap Done on the keyboard bar"
                placeholderTextColor={colors.inkMuted}
                style={[styles.input, styles.notes]}
                multiline
                textAlignVertical="top"
                inputAccessoryViewID={
                  Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined
                }
              />

              <Text style={styles.label}>Deadline (optional)</Text>
              <Text style={styles.help}>
                When this task is due. Overdue items show in red and are called out in pulse
                reminders.
              </Text>
              <View style={styles.row}>
                <Pressable
                  style={styles.chip}
                  onPress={() => {
                    dismissKeyboard();
                    setShowPicker(true);
                  }}
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
                  <Pressable
                    style={styles.chipGhost}
                    onPress={() => {
                      dismissKeyboard();
                      setDeadline(null);
                    }}
                  >
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
                <Pressable
                  style={styles.chipGhost}
                  onPress={() => {
                    dismissKeyboard();
                    setShowPicker(false);
                  }}
                >
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
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
          <View style={styles.accessory}>
            <Pressable
              onPress={dismissKeyboard}
              hitSlop={12}
              style={styles.accessoryBtn}
              accessibilityRole="button"
              accessibilityLabel="Dismiss keyboard"
            >
              <Text style={styles.accessoryBtnText}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    maxHeight: '92%',
  },
  scrollContent: {
    paddingBottom: 8,
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
  help: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
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
    minHeight: 88,
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
  accessory: {
    backgroundColor: colors.bgSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  accessoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  accessoryBtnText: {
    color: colors.accentSoft,
    fontSize: 17,
    fontWeight: '700',
  },
});
