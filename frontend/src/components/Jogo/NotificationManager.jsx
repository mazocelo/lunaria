import React, { useState, useCallback, useEffect } from 'react';
import Notification from '../Notification';

const MAX_VISIBLE = 3;
let notifyCallback = null;
let nextId = 0;

/**
 * Função global para mostrar notificações in-game
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo: info, success, error, warning
 */
export const showGameNotification = (message, type = 'info') => {
  if (notifyCallback) {
    notifyCallback(message, type);
  }
};

/**
 * Gerenciador de notificações para o jogo — suporta stack de até 3 simultâneas
 */
const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((message, type) => {
    const id = ++nextId;
    setNotifications(prev => {
      const updated = [...prev, { id, message, type }];
      // Manter apenas as MAX_VISIBLE mais recentes
      return updated.slice(-MAX_VISIBLE);
    });
  }, []);

  useEffect(() => {
    notifyCallback = addNotification;
    window.showGameNotification = addNotification;

    return () => {
      notifyCallback = null;
      window.showGameNotification = null;
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
