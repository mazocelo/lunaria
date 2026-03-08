import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/theme.jsx';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

const Notification = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  show = true,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    setIsVisible(show);
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!isVisible) return null;

  const typeClasses = {
    success: isLight
      ? 'bg-green-500/10 border-green-500/20 text-green-700'
      : 'bg-green-500/20 border-green-500/30 text-green-300',
    error: isLight
      ? 'bg-red-500/10 border-red-500/20 text-red-700'
      : 'bg-red-500/20 border-red-500/30 text-red-300',
    warning: isLight
      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700'
      : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
    info: isLight
      ? 'bg-blue-500/10 border-blue-500/20 text-blue-700'
      : 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  };

  const Icon = iconMap[type] || Info;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right" role="alert" aria-live="assertive" aria-atomic="true">
      <div className={`p-4 rounded-lg border backdrop-blur-lg ${typeClasses[type]} max-w-sm ${isLight ? 'glass-light' : 'glass'}`}>
        <div className="flex items-start space-x-3">
          <Icon size={18} className={`flex-shrink-0 mt-0.5 ${iconColorMap[type]}`} />
          <div className="flex-1">
            <p className="font-modern text-sm">{message}</p>
          </div>
          <button
            onClick={() => { setIsVisible(false); onClose?.(); }}
            className="text-current hover:text-white transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification; 