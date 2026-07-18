import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AddTodoModal } from './src/components/AddTodoModal';
import { SettingsModal } from './src/components/SettingsModal';
import { TodoRow } from './src/components/TodoRow';
import {
  ensureNotificationPermissions,
  schedulePulseReminders,
} from './src/notifications';
import {
  createTodo,
  loadSettings,
  loadTodos,
  saveSettings,
  saveTodos,
} from './src/storage';
import { colors } from './src/theme';
import { AppSettings, DEFAULT_SETTINGS, Todo } from './src/types';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);
  const overdueCount = useMemo(() => {
    const now = Date.now();
    return todos.filter(
      (t) => !t.completed && t.deadline && new Date(t.deadline).getTime() < now
    ).length;
  }, [todos]);

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const ad = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    });
  }, [todos]);

  const persistTodos = useCallback(async (next: Todo[]) => {
    setTodos(next);
    await saveTodos(next);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [loadedTodos, loadedSettings] = await Promise.all([loadTodos(), loadSettings()]);
      if (!mounted) return;
      setTodos(loadedTodos);
      setSettings(loadedSettings);
      await ensureNotificationPermissions();
      await schedulePulseReminders(loadedSettings, loadedTodos);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Only when pulse settings change — not on every todo edit (that reset the countdown).
    schedulePulseReminders(settings, todos).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- todos omitted on purpose
  }, [ready, settings]);

  const onAdd = async (title: string, notes: string, deadline: Date | null) => {
    const next = [createTodo(title, notes, deadline), ...todos];
    await persistTodos(next);
  };

  const onToggle = async (id: string) => {
    const next = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    await persistTodos(next);
  };

  const onDelete = async (id: string) => {
    await persistTodos(todos.filter((t) => t.id !== id));
  };

  const onSaveSettings = async (next: AppSettings) => {
    setSettings(next);
    await saveSettings(next);
    await schedulePulseReminders(next, todos);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PulseTodo</Text>
            <Text style={styles.subhead}>
              {openCount === 0
                ? 'Nothing urgent permanently listed'
                : `${openCount} open${overdueCount ? ` · ${overdueCount} overdue` : ''}`}
            </Text>
          </View>
          <Pressable style={styles.settingsBtn} onPress={() => setSettingsOpen(true)}>
            <Text style={styles.settingsText}>Pulse</Text>
          </Pressable>
        </View>

        <View style={styles.pulseBar}>
          <Text style={styles.pulseBarText}>
            Reminder every {settings.intervalMinutes} min
            {settings.remindersEnabled ? '' : ' (off)'}
          </Text>
        </View>

        <FlatList
          data={sortedTodos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Your permanent list</Text>
              <Text style={styles.emptyBody}>
                Add todos with deadlines. Every few minutes a reminder appears while you
                use other apps — tap it to open this list and clear anything urgent.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TodoRow todo={item} onToggle={onToggle} onDelete={onDelete} />
          )}
        />

        <View style={styles.footer}>
          <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <Text style={styles.addBtnText}>+ Add todo</Text>
          </Pressable>
        </View>

        <AddTodoModal
          visible={addOpen}
          onClose={() => setAddOpen(false)}
          onSave={onAdd}
        />
        <SettingsModal
          visible={settingsOpen}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={onSaveSettings}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subhead: {
    color: colors.inkMuted,
    marginTop: 4,
    fontSize: 14,
  },
  settingsBtn: {
    backgroundColor: colors.bgSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  settingsText: {
    color: colors.accentSoft,
    fontWeight: '700',
  },
  pulseBar: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pulseBarText: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    flexGrow: 1,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: 'rgba(11,31,26,0.92)',
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
});
