export type Todo = {
  id: string;
  title: string;
  notes: string;
  deadline: string | null; // ISO date string
  completed: boolean;
  createdAt: string;
};

export type AppSettings = {
  /** Reminder interval in minutes (how often the pulse appears). */
  intervalMinutes: number;
  /** Whether periodic pulse reminders are enabled. */
  remindersEnabled: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  intervalMinutes: 15,
  remindersEnabled: true,
};
