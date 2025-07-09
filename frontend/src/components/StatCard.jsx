import React from 'react';
import { useTheme } from '../contexts/theme.jsx';

const StatCard = ({ 
    title, 
    value, 
    icon, 
    variant = 'primary',
    trend = null,
    subtitle = null,
    className = ''
}) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    
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
        neutral: isLight ? 'text-slate-500' : 'text-slate-400'
    };

    return (
        <div className={`${isLight ? 'card-rpg-light' : 'card-rpg'} hover-lift ${className}`}>
            <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${variantClasses[variant]} rounded-lg flex items-center justify-center`}>
                    <span className="text-xl">{icon}</span>
                </div>
                <div className="flex-1">
                    <div className={`text-2xl font-bold font-modern ${
                        isLight ? 'text-slate-800' : 'text-white'
                    }`}>
                        {value}
                    </div>
                    <div className={`text-sm font-modern ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                        {title}
                    </div>
                    {subtitle && (
                        <div className={`text-xs font-modern mt-1 ${
                            isLight ? 'text-slate-500' : 'text-slate-500'
                        }`}>
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