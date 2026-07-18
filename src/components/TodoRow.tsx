import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Todo } from '../types';
import { colors } from '../theme';

type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

function formatDeadline(iso: string | null): { label: string; tone: 'ok' | 'soon' | 'late' | 'none' } {
  if (!iso) return { label: 'No deadline', tone: 'none' };
  const d = new Date(iso);
  const now = Date.now();
  const diff = d.getTime() - now;
  const label = d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  if (diff < 0) return { label: `Overdue · ${label}`, tone: 'late' };
  if (diff <= 24 * 60 * 60 * 1000) return { label: `Due soon · ${label}`, tone: 'soon' };
  return { label, tone: 'ok' };
}

export function TodoRow({ todo, onToggle, onDelete }: Props) {
  const deadline = formatDeadline(todo.deadline);

  return (
    <View style={[styles.row, todo.completed && styles.rowDone]}>
      <Pressable
        style={styles.checkHit}
        onPress={() => onToggle(todo.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.completed }}
      >
        <View style={[styles.check, todo.completed && styles.checkOn]}>
          {todo.completed ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
      </Pressable>

      <View style={styles.body}>
        <Text style={[styles.title, todo.completed && styles.titleDone]}>{todo.title}</Text>
        {todo.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {todo.notes}
          </Text>
        ) : null}
        <Text
          style={[
            styles.deadline,
            deadline.tone === 'late' && styles.late,
            deadline.tone === 'soon' && styles.soon,
          ]}
        >
          {deadline.label}
        </Text>
      </View>

      <Pressable onPress={() => onDelete(todo.id)} hitSlop={10}>
        <Text style={styles.delete}>Delete</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowDone: {
    opacity: 0.55,
  },
  checkHit: {
    paddingTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.accent,
  },
  checkMark: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '600',
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.inkMuted,
  },
  notes: {
    color: colors.inkMuted,
    marginTop: 3,
    fontSize: 14,
  },
  deadline: {
    marginTop: 6,
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  late: {
    color: colors.danger,
  },
  soon: {
    color: colors.warn,
  },
  delete: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
    paddingTop: 4,
  },
});
