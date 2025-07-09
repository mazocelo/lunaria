import React from 'react';
import { useTheme } from '../contexts/theme.jsx';

const RPGCard = ({ 
    children, 
    className = '', 
    hover = true, 
    glow = false,
    variant = 'default',
    onClick,
    disabled = false
}) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    
    const baseClasses = `${isLight ? 'card-rpg-light' : 'card-rpg'} transition-all duration-300`;
    const hoverClasses = hover ? "hover-lift" : "";
    const glowClasses = glow ? "animate-glow" : "";
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
    
    const variantClasses = {
        default: "",
        primary: isLight ? "border-purple-500/20" : "border-purple-500/30",
        secondary: isLight ? "border-cyan-500/20" : "border-cyan-500/30",
        accent: isLight ? "border-green-500/20" : "border-green-500/30",
        danger: isLight ? "border-red-500/20" : "border-red-500/30"
    };

    return (
        <div 
            className={`${baseClasses} ${hoverClasses} ${glowClasses} ${disabledClasses} ${variantClasses[variant]} ${className}`}
            onClick={!disabled ? onClick : undefined}
        >
            {children}
        </div>
    );
};

export default RPGCard; 