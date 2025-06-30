import React from 'react';
import { IconType } from 'react-icons';
import { useTheme } from '../../context/ThemeContext';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
    variant?: 'default' | 'ghost' | 'outline' | 'primary' | 'success' | 'danger' | 'warning';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    icon: IconType;
    loading?: boolean;
    children?: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({
    variant = 'default',
    size = 'md',
    icon: Icon,
    loading = false,
    children,
    className = '',
    disabled,
    ...props
}) => {
    const { isDarkMode } = useTheme();

    const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-all duration-200 transform group hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3',
        xl: 'p-4'
    };

    const iconSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    };

    const variantClasses = {
        default: isDarkMode
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700 focus:ring-gray-500'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500',
        ghost: isDarkMode
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700 focus:ring-gray-500'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500',
        outline: isDarkMode
            ? 'text-gray-300 bg-transparent border border-gray-600 hover:bg-gray-700 hover:border-gray-500 focus:ring-gray-500'
            : 'text-gray-700 bg-transparent border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500',
        primary: isDarkMode
            ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        success: isDarkMode
            ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
            : 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500',
        danger: isDarkMode
            ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
            : 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: isDarkMode
            ? 'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
            : 'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    };

    const classes = [
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <div className={`${iconSizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
            ) : (
                <Icon className={`${iconSizeClasses[size]} transition-transform duration-200 group-hover:scale-110`} />
            )}
            {children}
        </button>
    );
};

export default IconButton; 