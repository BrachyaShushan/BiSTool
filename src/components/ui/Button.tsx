import React from 'react';
import { IconType } from 'react-icons';
import { useTheme } from '../../context/ThemeContext';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    icon?: IconType;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    children,
    className = '',
    disabled,
    ...props
}) => {
    const { isDarkMode } = useTheme();

    const baseClasses = 'overflow-hidden inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 transform group hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none';

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm space-x-1.5',
        md: 'px-4 py-2.5 text-sm space-x-2',
        lg: 'px-6 py-3 text-sm space-x-2',
        xl: 'px-8 py-4 text-base space-x-3'
    };

    const variantClasses = {
        primary: isDarkMode
            ? 'text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 focus:ring-blue-500'
            : 'text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 focus:ring-blue-500',
        secondary: isDarkMode
            ? 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600 focus:ring-gray-500'
            : 'text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200 focus:ring-gray-500',
        success: isDarkMode
            ? 'text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 focus:ring-emerald-500'
            : 'text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 focus:ring-emerald-500',
        danger: isDarkMode
            ? 'text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 focus:ring-red-500'
            : 'text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 focus:ring-red-500',
        warning: isDarkMode
            ? 'text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg shadow-yellow-500/25 focus:ring-yellow-500'
            : 'text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg shadow-yellow-500/25 focus:ring-yellow-500',
        ghost: isDarkMode
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700 focus:ring-gray-500'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500',
        outline: isDarkMode
            ? 'text-gray-300 bg-transparent border border-gray-600 hover:bg-gray-700 hover:border-gray-500 focus:ring-gray-500'
            : 'text-gray-700 bg-transparent border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    const classes = [
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        widthClass,
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || loading}
            {...props}
        >
            {/* Shimmer effect for primary buttons */}
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-r transition-transform duration-700 transform -translate-x-full -skew-x-12 from-white/0 via-white/20 to-white/0 group-hover:translate-x-full"></div>
            )}

            {/* Loading spinner */}
            {loading && (
                <div className="relative z-10 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            )}

            {/* Icon */}
            {Icon && !loading && iconPosition === 'left' && (
                <Icon className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            )}

            {/* Content */}
            <span className="relative z-10">{children}</span>

            {/* Icon */}
            {Icon && !loading && iconPosition === 'right' && (
                <Icon className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            )}
        </button>
    );
};

export default Button; 