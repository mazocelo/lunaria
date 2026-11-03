const STORAGE_KEY = 'lunaria_notifications_enabled';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

export function isNotificationsSupported(): boolean {
  return 'Notification' in window;
}

export function isNotificationsEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setNotificationsEnabled(val: boolean): boolean {
  localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false');
  return val;
}

export async function requestPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    setNotificationsEnabled(true);
    return true;
  }
  return false;
}

export function getPermissionState(): NotificationPermissionState {
  if (!isNotificationsSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export function sendNotification(
  title: string,
  options: NotificationOptions = {}
): Notification | undefined {
  if (!isNotificationsSupported() || !isNotificationsEnabled()) return undefined;
  if (Notification.permission !== 'granted') return undefined;
  if (document.hasFocus()) return undefined; // don't notify if tab is focused

  const notification = new Notification(title, {
    icon: '/assets/logo_lunaria.png',
    badge: '/assets/logo_lunaria.png',
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}
