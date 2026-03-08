import React from 'react';
import { useTheme } from '../contexts/theme.jsx';

/**
 * StatCard - Key metric display card
 *
 * @param {Object} props
 * @param {string} props.title - Label text
 * @param {string|number} props.value - Metric value
 * @param {string|React.ComponentType} props.icon - Emoji string or Lucide icon component
 * @param {string} props.variant - 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger'
 * @param {Object} props.trend - Optional trend {direction: 'up'|'down'|'neutral', value: string}
 * @param {string} props.subtitle - Optional subtitle
 * @param {string} props.className - Additional classes
 */
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

    // Support both emoji strings and Lucide icon components
    const isLucideIcon = typeof icon === 'function' || (typeof icon === 'object' && icon !== null && icon.$$typeof);
    const IconComponent = isLucideIcon ? icon : null;

    return (
        <div className={`card-rpg hover-lift ${className}`}>
            <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${variantClasses[variant]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {IconComponent ? (
                        <IconComponent size={22} className="text-white" />
                    ) : (
                        <span className="text-xl">{icon}</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
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