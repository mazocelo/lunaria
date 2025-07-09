import React from 'react';

const StatCard = ({ 
    title, 
    value, 
    icon, 
    variant = 'primary',
    trend = null,
    subtitle = null,
    className = ''
}) => {
    const variantClasses = {
        primary: 'gradient-primary',
        secondary: 'gradient-secondary',
        accent: 'gradient-accent',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        danger: 'bg-red-600'
    };

    const trendColors = {
        up: 'text-green-400',
        down: 'text-red-400',
        neutral: 'text-slate-400'
    };

    return (
        <div className={`card-rpg hover-lift ${className}`}>
            <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${variantClasses[variant]} rounded-lg flex items-center justify-center`}>
                    <span className="text-xl">{icon}</span>
                </div>
                <div className="flex-1">
                    <div className="text-2xl font-bold text-white font-modern">
                        {value}
                    </div>
                    <div className="text-sm text-slate-400 font-modern">
                        {title}
                    </div>
                    {subtitle && (
                        <div className="text-xs text-slate-500 font-modern mt-1">
                            {subtitle}
                        </div>
                    )}
                    {trend && (
                        <div className={`text-xs font-semibold mt-1 ${trendColors[trend.direction]}`}>
                            {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} 
                            {trend.value}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatCard; 