import React from 'react';
import { IconType } from 'react-icons';
import { FiCheck } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    icon?: IconType;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
    gradient?: boolean;
    isChecked?: boolean;
    showCheckmark?: boolean;
    children: React.ReactNode;
    'data-testid'?: string;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    gradient = false,
    isChecked = false,
    showCheckmark = true,
    children,
    className = '',
    disabled,
    'data-testid': dataTestId,
    ...props
}) => {
    const { isDarkMode } = useTheme();

    const baseClasses = 'overflow-hidden inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 transform group hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none relative';

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm space-x-1.5',
        md: 'px-4 py-2.5 text-sm space-x-2',
        lg: 'px-6 py-3 text-sm space-x-2',
        xl: 'px-8 py-4 text-base space-x-3'
    };

    const getVariantClasses = () => {
        const variants = {
            primary: {
                gradient: isDarkMode
                    ? `text-white bg-gradient-to-r ${isChecked ? 'from-blue-700 via-indigo-700 to-purple-700 shadow-lg shadow-blue-600/40 ring-2 ring-blue-400/50' : 'from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-500/25'} focus:ring-blue-500`
                    : `text-white bg-gradient-to-r ${isChecked ? 'from-blue-700 via-indigo-700 to-purple-700 shadow-lg shadow-blue-600/40 ring-2 ring-blue-400/50' : 'from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-500/25'} focus:ring-blue-500`,
                solid: isDarkMode
                    ? `text-white ${isChecked ? 'bg-blue-700 shadow-lg shadow-blue-600/40 ring-2 ring-blue-400/50' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25'} focus:ring-blue-500`
                    : `text-white ${isChecked ? 'bg-blue-700 shadow-lg shadow-blue-600/40 ring-2 ring-blue-400/50' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25'} focus:ring-blue-500`
            },
            secondary: {
                gradient: isDarkMode
                    ? `text-white bg-gradient-to-r ${isChecked ? 'from-gray-700 via-gray-800 to-gray-900 shadow-lg shadow-gray-600/40 ring-2 ring-gray-400/50' : 'from-gray-600 via-gray-700 to-gray-800 hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 shadow-lg shadow-gray-500/25'} focus:ring-gray-500`
                    : `text-white bg-gradient-to-r ${isChecked ? 'from-gray-600 via-gray-700 to-gray-800 shadow-lg shadow-gray-600/40 ring-2 ring-gray-400/50' : 'from-gray-500 via-gray-600 to-gray-700 hover:from-gray-600 hover:via-gray-700 hover:to-gray-800 shadow-lg shadow-gray-500/25'} focus:ring-gray-500`,
                solid: isDarkMode
                    ? `${isChecked ? 'text-white bg-gray-600 border-gray-500 ring-2 ring-gray-400/50' : 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'} focus:ring-gray-500`
                    : `${isChecked ? 'text-white bg-gray-300 border-gray-400 ring-2 ring-gray-400/50' : 'text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200'} focus:ring-gray-500`
            },
            success: {
                gradient: isDarkMode
                    ? `text-white bg-gradient-to-r ${isChecked ? 'from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/40 ring-2 ring-emerald-400/50' : 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25'} focus:ring-emerald-500`
                    : `text-white bg-gradient-to-r ${isChecked ? 'from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/40 ring-2 ring-emerald-400/50' : 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25'} focus:ring-emerald-500`,
                solid: isDarkMode
                    ? `text-white ${isChecked ? 'bg-emerald-700 shadow-lg shadow-emerald-600/40 ring-2 ring-emerald-400/50' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25'} focus:ring-emerald-500`
                    : `text-white ${isChecked ? 'bg-emerald-700 shadow-lg shadow-emerald-600/40 ring-2 ring-emerald-400/50' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25'} focus:ring-emerald-500`
            },
            danger: {
                gradient: isDarkMode
                    ? `text-white bg-gradient-to-r ${isChecked ? 'from-red-600 to-red-700 shadow-lg shadow-red-600/40 ring-2 ring-red-400/50' : 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25'} focus:ring-red-500`
                    : `text-white bg-gradient-to-r ${isChecked ? 'from-red-600 to-red-700 shadow-lg shadow-red-600/40 ring-2 ring-red-400/50' : 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25'} focus:ring-red-500`,
                solid: isDarkMode
                    ? `text-white ${isChecked ? 'bg-red-700 shadow-lg shadow-red-600/40 ring-2 ring-red-400/50' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25'} focus:ring-red-500`
                    : `text-white ${isChecked ? 'bg-red-700 shadow-lg shadow-red-600/40 ring-2 ring-red-400/50' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25'} focus:ring-red-500`
            },
            warning: {
                gradient: isDarkMode
                    ? `text-white bg-gradient-to-r ${isChecked ? 'from-yellow-600 to-yellow-700 shadow-lg shadow-yellow-600/40 ring-2 ring-yellow-400/50' : 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg shadow-yellow-500/25'} focus:ring-yellow-500`
                    : `text-white bg-gradient-to-r ${isChecked ? 'from-yellow-600 to-yellow-700 shadow-lg shadow-yellow-600/40 ring-2 ring-yellow-400/50' : 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg shadow-yellow-500/25'} focus:ring-yellow-500`,
                solid: isDarkMode
                    ? `text-white ${isChecked ? 'bg-yellow-700 shadow-lg shadow-yellow-600/40 ring-2 ring-yellow-400/50' : 'bg-yellow-600 hover:bg-yellow-700 shadow-lg shadow-yellow-500/25'} focus:ring-yellow-500`
                    : `text-white ${isChecked ? 'bg-yellow-700 shadow-lg shadow-yellow-600/40 ring-2 ring-yellow-400/50' : 'bg-yellow-600 hover:bg-yellow-700 shadow-lg shadow-yellow-500/25'} focus:ring-yellow-500`
            },
            ghost: {
                gradient: isDarkMode
                    ? `${isChecked ? 'text-white bg-gradient-to-r from-gray-600/70 via-gray-700/70 to-gray-800/70 shadow-lg shadow-gray-600/40 ring-2 ring-gray-400/50' : 'text-white bg-gradient-to-r from-gray-700/50 via-gray-800/50 to-gray-900/50 hover:from-gray-600/60 hover:via-gray-700/60 hover:to-gray-800/60'} focus:ring-gray-500`
                    : `${isChecked ? 'text-white bg-gradient-to-r from-gray-300/90 via-gray-400/90 to-gray-500/90 shadow-lg shadow-gray-400/40 ring-2 ring-gray-400/50' : 'text-gray-800 bg-gradient-to-r from-gray-100/80 via-gray-200/80 to-gray-300/80 hover:from-gray-200/90 hover:via-gray-300/90 hover:to-gray-400/90'} focus:ring-gray-500`,
                solid: isDarkMode
                    ? `${isChecked ? 'text-white bg-gray-600 ring-2 ring-gray-400/50' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'} focus:ring-gray-500`
                    : `${isChecked ? 'text-white bg-gray-300 ring-2 ring-gray-400/50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'} focus:ring-gray-500`
            },
            outline: {
                gradient: isDarkMode
                    ? `${isChecked ? 'text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 border-transparent shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/50' : 'text-blue-400 bg-transparent border-2 border-blue-500 hover:bg-gradient-to-r hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 hover:text-white hover:border-transparent'} focus:ring-blue-500 transition-all duration-200`
                    : `${isChecked ? 'text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 border-transparent shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/50' : 'text-blue-600 bg-transparent border-2 border-blue-500 hover:bg-gradient-to-r hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 hover:text-white hover:border-transparent'} focus:ring-blue-500 transition-all duration-200`,
                solid: isDarkMode
                    ? `${isChecked ? 'text-white bg-gray-600 border-gray-500 ring-2 ring-gray-400/50' : 'text-gray-300 bg-transparent border border-gray-600 hover:bg-gray-700 hover:border-gray-500'} focus:ring-gray-500`
                    : `${isChecked ? 'text-white bg-gray-300 border-gray-400 ring-2 ring-gray-400/50' : 'text-gray-700 bg-transparent border border-gray-300 hover:bg-gray-50 hover:border-gray-400'} focus:ring-gray-500`
            }
        };

        return variants[variant][gradient ? 'gradient' : 'solid'];
    };

    const widthClass = fullWidth ? 'w-full' : '';

    const classes = [
        baseClasses,
        sizeClasses[size],
        getVariantClasses(),
        widthClass,
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || loading}
            data-testid={dataTestId}
            data-checked={isChecked}
            {...props}
        >
            {/* Checkmark indicator for checked state */}
            {isChecked && showCheckmark && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <FiCheck className="w-2 h-2 text-gray-800" />
                </div>
            )}

            {/* Shimmer effect for gradient buttons */}
            {gradient && (
                <div className="absolute inset-0 transition-transform duration-700 transform -translate-x-full -skew-x-12 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full"></div>
            )}

            {/* Loading spinner */}
            {loading && (
                <div className="relative z-10 w-4 h-4 border-2 border-current rounded-full border-t-transparent animate-spin"></div>
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