import React from "react";

const Button = ({ 
    title, 
    onClick, 
    type = "button", 
    className = "", 
    children, 
    variant = "primary",
    size = "medium",
    disabled = false 
}) => {
    const baseClasses = "btn-rpg hover-lift font-modern transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantClasses = {
        primary: "gradient-primary",
        secondary: "gradient-secondary", 
        accent: "gradient-accent",
        danger: "bg-red-600 hover:bg-red-700",
        ghost: "glass hover:bg-slate-700/50"
    };
    
    const sizeClasses = {
        small: "px-3 py-2 text-sm",
        medium: "px-4 py-2",
        large: "px-6 py-3 text-lg"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {children || title}
        </button>
    );
};

export default Button;