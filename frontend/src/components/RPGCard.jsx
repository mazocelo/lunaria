import React from 'react';

const RPGCard = ({ 
    children, 
    className = '', 
    hover = true, 
    glow = false,
    variant = 'default',
    onClick,
    disabled = false
}) => {
    const baseClasses = "card-rpg transition-all duration-300";
    const hoverClasses = hover ? "hover-lift" : "";
    const glowClasses = glow ? "animate-glow" : "";
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
    
    const variantClasses = {
        default: "",
        primary: "border-purple-500/30",
        secondary: "border-cyan-500/30",
        accent: "border-green-500/30",
        danger: "border-red-500/30"
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