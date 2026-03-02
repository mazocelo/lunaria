import React, { useState } from 'react';
import Notification from '../Notification';

let notifyCallback = null;

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
 * Gerenciador de notificações para o jogo
 * Usa o componente Notification.jsx existente
 */
const NotificationManager = () => {
  const [notification, setNotification] = useState(null);

  React.useEffect(() => {
    // Callback para adicionar notificação
    notifyCallback = (message, type) => {
      setNotification({ message, type, show: true });
    };
    
    // ✅ Expor globalmente para socket store acessar
    window.showGameNotification = notifyCallback;

    return () => {
      notifyCallback = null;
      window.showGameNotification = null;
    };
  }, []);

  if (!notification?.show) return null;

  return (
    <Notification
      message={notification.message}
      type={notification.type}
      show={notification.show}
      duration={5000}
      onClose={() => setNotification(null)}
    />
  );
};

export default NotificationManager;

