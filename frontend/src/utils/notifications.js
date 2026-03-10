const STORAGE_KEY = 'lunaria_notifications_enabled';

export function isNotificationsSupported() {
  return 'Notification' in window;
}

export function isNotificationsEnabled() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setNotificationsEnabled(val) {
  localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false');
  return val;
}

export async function requestPermission() {
  if (!isNotificationsSupported()) return false;
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    setNotificationsEnabled(true);
    return true;
  }
  return false;
}

export function getPermissionState() {
  if (!isNotificationsSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export function sendNotification(title, options = {}) {
  if (!isNotificationsSupported() || !isNotificationsEnabled()) return;
  if (Notification.permission !== 'granted') return;
  if (document.hasFocus()) return; // don't notify if tab is focused

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
