import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { AppSettings, Todo } from './types';

const PULSE_NOTIFICATION_ID = 'pulsetodo-repeating-pulse';

// Only surface pulses when the user is outside the app.
// If PulseTodo is already open, the list is right there — no banner/overlay.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const inApp = AppState.currentState === 'active';
    return {
      shouldShowBanner: !inApp,
      shouldShowList: !inApp,
      shouldPlaySound: !inApp,
      shouldSetBadge: true,
    };
  },
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice && Platform.OS === 'ios') {
    // Simulator can still schedule local notifications on newer iOS/Xcode.
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

function urgentSummary(todos: Todo[]): string {
  const open = todos.filter((t) => !t.completed);
  if (open.length === 0) return 'Inbox clear — tap to confirm.';

  const now = Date.now();
  const overdue = open.filter((t) => t.deadline && new Date(t.deadline).getTime() < now);
  const dueSoon = open.filter((t) => {
    if (!t.deadline) return false;
    const ms = new Date(t.deadline).getTime() - now;
    return ms >= 0 && ms <= 24 * 60 * 60 * 1000;
  });

  if (overdue.length > 0) {
    return `${overdue.length} overdue · ${open[0].title}`;
  }
  if (dueSoon.length > 0) {
    return `${dueSoon.length} due soon · ${dueSoon[0].title}`;
  }
  return `${open.length} open · ${open[0].title}`;
}

/**
 * iOS cannot draw a true system overlay above other apps without jailbreak.
 * Closest supported behavior: repeating local notification every X minutes.
 * Tap opens PulseTodo to the permanent list. No UI when the app is already open.
 *
 * Caveats (Apple limits, not avoidable without a server):
 * - Notification text is fixed until the app opens and reschedules.
 * - iOS may delay banners under Focus / Scheduled Summary.
 * - timeSensitive may behave like a normal alert without Apple entitlement.
 */
export async function schedulePulseReminders(
  settings: AppSettings,
  todos: Todo[]
): Promise<void> {
  // Cancel only our pulse — avoid wiping unrelated schedules if any are added later.
  await Notifications.cancelScheduledNotificationAsync(PULSE_NOTIFICATION_ID).catch(() => undefined);

  if (!settings.remindersEnabled) {
    return;
  }

  const ok = await ensureNotificationPermissions();
  if (!ok) return;

  // iOS repeating interval minimum is 60s.
  const minutes = Math.max(1, Math.min(1440, Math.round(settings.intervalMinutes)));
  const seconds = minutes * 60;

  await Notifications.scheduleNotificationAsync({
    identifier: PULSE_NOTIFICATION_ID,
    content: {
      title: 'PulseTodo',
      body: urgentSummary(todos),
      sound: true,
      data: { openTodos: true, source: 'pulse' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: true,
    },
  });
}
