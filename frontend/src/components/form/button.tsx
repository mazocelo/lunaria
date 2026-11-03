import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useTheme } from '../../contexts/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
    title?: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const Button = ({
    title,
    onClick,
    type = 'button',
    className = '',
    children,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    ...rest
}: ButtonProps) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const baseClasses = `${isLight ? 'btn-rpg-light' : 'btn-rpg'} hover-lift font-modern transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2`;

    const cursorClass = variant === 'ghost' || variant === 'primary' || variant === 'secondary' || variant === 'accent' || variant === 'danger' ? 'cursor-pointer' : '';

    const variantClasses: Record<ButtonVariant, string> = {
        primary: 'gradient-primary',
        secondary: 'gradient-secondary',
        accent: 'gradient-accent',
        danger: 'bg-red-600 hover:bg-red-700',
        ghost: isLight ? 'glass-light hover:bg-slate-100/50' : 'glass hover:bg-slate-700/50',
    };

    const sizeClasses: Record<ButtonSize, string> = {
        small: 'px-3 py-2 text-sm',
        medium: 'px-4 py-2',
        large: 'px-6 py-3 text-lg',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${cursorClass} ${className}`}
            {...rest}
        >
            {children || title}
        </button>
    );
};

export default Button;
