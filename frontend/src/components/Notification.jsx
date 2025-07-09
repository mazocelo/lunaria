import React, { useState, useEffect } from 'react';

const Notification = ({ 
    message, 
    type = 'info', 
    duration = 5000, 
    onClose,
    show = true 
}) => {
    const [isVisible, setIsVisible] = useState(show);

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
        success: 'bg-green-500/20 border-green-500/30 text-green-300',
        error: 'bg-red-500/20 border-red-500/30 text-red-300',
        warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
        info: 'bg-blue-500/20 border-blue-500/30 text-blue-300'
    };

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    return (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in-right`}>
            <div className={`p-4 rounded-lg border backdrop-blur-lg ${typeClasses[type]} max-w-sm`}>
                <div className="flex items-start space-x-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                        {icons[type]}
                    </span>
                    <div className="flex-1">
                        <p className="font-modern text-sm">{message}</p>
                    </div>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            onClose?.();
                        }}
                        className="text-current hover:text-white transition-colors flex-shrink-0"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Notification; 