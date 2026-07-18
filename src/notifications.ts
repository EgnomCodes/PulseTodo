import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { AppSettings, Todo } from './types';

const PULSE_ID_PREFIX = 'pulsetodo-pulse-';
/** How many upcoming one-shot pulses to keep queued (iOS caps ~64 total). */
const PULSE_QUEUE_SIZE = 40;

// Always allow presentation. Suppressing based on AppState was unreliable on iOS
// and made it look like notifications were "broken" during testing.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type PermissionSnapshot = {
  granted: boolean;
  status: string;
  scheduledCount: number;
};

export async function getPermissionSnapshot(): Promise<PermissionSnapshot> {
  const current = await Notifications.getPermissionsAsync();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter((n) => n.identifier.startsWith(PULSE_ID_PREFIX));
  const status =
    current.granted
      ? 'granted'
      : current.ios?.status === Notifications.IosAuthorizationStatus.DENIED
        ? 'denied'
        : current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
          ? 'provisional'
          : 'undetermined';

  return {
    granted:
      current.granted ||
      current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
    status,
    scheduledCount: ours.length,
  };
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  void Device.isDevice; // keep import used; simulators can still schedule locals

  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
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

export async function openSystemNotificationSettings(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Linking.openSettings();
  }
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

async function cancelOurPulses(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PULSE_ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/**
 * Queue many one-shot notifications instead of a single repeating trigger.
 * Repeating TIME_INTERVAL has been flaky for some sideloaded iOS builds;
 * an explicit queue is more reliable and still auto-continues until emptied.
 */
export async function schedulePulseReminders(
  settings: AppSettings,
  todos: Todo[]
): Promise<PermissionSnapshot> {
  await cancelOurPulses();

  if (!settings.remindersEnabled) {
    return getPermissionSnapshot();
  }

  const ok = await ensureNotificationPermissions();
  if (!ok) {
    return getPermissionSnapshot();
  }

  const minutes = Math.max(1, Math.min(1440, Math.round(settings.intervalMinutes)));
  const intervalSeconds = minutes * 60;
  const body = urgentSummary(todos);

  for (let i = 1; i <= PULSE_QUEUE_SIZE; i++) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PULSE_ID_PREFIX}${i}`,
      content: {
        title: 'PulseTodo',
        body,
        sound: true,
        data: { openTodos: true, source: 'pulse' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: intervalSeconds * i,
        repeats: false,
      },
    });
  }

  return getPermissionSnapshot();
}

/** Fires once in ~5s so you can verify permission + delivery without waiting for the interval. */
export async function sendTestNotification(): Promise<string> {
  const ok = await ensureNotificationPermissions();
  if (!ok) {
    return 'Permission denied. Enable Notifications for PulseTodo in iOS Settings, then try again.';
  }

  await Notifications.scheduleNotificationAsync({
    identifier: `${PULSE_ID_PREFIX}test`,
    content: {
      title: 'PulseTodo test',
      body: 'Notifications work. Leave the app for regular pulses.',
      sound: true,
      data: { openTodos: true, source: 'test' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });

  return 'Test scheduled. Switch apps or lock the phone — banner in ~5 seconds.';
}
