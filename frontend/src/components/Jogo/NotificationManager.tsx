import { useState, useCallback, useEffect } from 'react';
import Notification from '../Notification';

type GameNotificationType = 'success' | 'error' | 'warning' | 'info';

interface GameNotificationEntry {
  id: number;
  message: string;
  type: GameNotificationType;
}

const MAX_VISIBLE = 3;
let notifyCallback: ((message: string, type: GameNotificationType) => void) | null = null;
let nextId = 0;

/**
 * Funcao global para mostrar notificacoes in-game.
 */
export const showGameNotification = (message: string, type: GameNotificationType = 'info'): void => {
  if (notifyCallback) {
    notifyCallback(message, type);
  }
};

/**
 * Gerenciador de notificacoes para o jogo — suporta stack de ate 3 simultaneas.
 */
const NotificationManager = () => {
  const [notifications, setNotifications] = useState<GameNotificationEntry[]>([]);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((message: string, type: GameNotificationType) => {
    const id = ++nextId;
    setNotifications((prev) => {
      const updated = [...prev, { id, message, type }];
      return updated.slice(-MAX_VISIBLE);
    });
  }, []);

  useEffect(() => {
    notifyCallback = addNotification;
    return () => {
      notifyCallback = null;
    };
  }, [addNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" style={{ pointerEvents: 'none' }}>
      {notifications.map((n) => (
        <div key={n.id} style={{ pointerEvents: 'auto' }}>
          <Notification
            message={n.message}
            type={n.type}
            show={true}
            duration={5000}
            onClose={() => removeNotification(n.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationManager;
