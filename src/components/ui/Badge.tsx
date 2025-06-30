import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface BadgeProps {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    className?: string;
    dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    size = 'md',
    children,
    className = '',
    dot = false
}) => {
    const { isDarkMode } = useTheme();

    const baseClasses = 'inline-flex items-center font-medium rounded-full';

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base'
    };

    const variantClasses = {
        default: isDarkMode
            ? 'bg-gray-700 text-gray-300'
            : 'bg-gray-100 text-gray-800',
        primary: isDarkMode
            ? 'bg-blue-900 text-blue-200'
            : 'bg-blue-100 text-blue-800',
        success: isDarkMode
            ? 'bg-green-900 text-green-200'
            : 'bg-green-100 text-green-800',
        warning: isDarkMode
            ? 'bg-yellow-900 text-yellow-200'
            : 'bg-yellow-100 text-yellow-800',
        danger: isDarkMode
            ? 'bg-red-900 text-red-200'
            : 'bg-red-100 text-red-800',
        info: isDarkMode
            ? 'bg-indigo-900 text-indigo-200'
            : 'bg-indigo-100 text-indigo-800'
    };

    const dotClasses = {
        default: isDarkMode ? 'bg-gray-400' : 'bg-gray-600',
        primary: isDarkMode ? 'bg-blue-400' : 'bg-blue-600',
        success: isDarkMode ? 'bg-green-400' : 'bg-green-600',
        warning: isDarkMode ? 'bg-yellow-400' : 'bg-yellow-600',
        danger: isDarkMode ? 'bg-red-400' : 'bg-red-600',
        info: isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600'
    };

    const classes = [
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={classes}>
            {dot && (
                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClasses[variant]}`} />
            )}
            {children}
        </span>
    );
};

export default Badge; 