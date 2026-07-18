import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS, Todo } from './types';

const TODOS_KEY = '@pulsetodo/todos';
const SETTINGS_KEY = '@pulsetodo/settings';

export async function loadTodos(): Promise<Todo[]> {
  const raw = await AsyncStorage.getItem(TODOS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Todo[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  await AsyncStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function createTodo(
  title: string,
  notes: string,
  deadline: Date | null
): Todo {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: title.trim(),
    notes: notes.trim(),
    deadline: deadline ? deadline.toISOString() : null,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}
