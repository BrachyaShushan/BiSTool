import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    variant?: 'default' | 'outlined' | 'filled';
    size?: 'sm' | 'md' | 'lg';
    error?: boolean;
    success?: boolean;
    fullWidth?: boolean;
    label?: string;
    helperText?: string;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea: React.FC<TextareaProps> = ({
    variant = 'default',
    size = 'md',
    error = false,
    success = false,
    fullWidth = false,
    label,
    helperText,
    resize = 'vertical',
    className = '',
    ...props
}) => {
    const { isDarkMode } = useTheme();

    const baseClasses = 'rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
        default: isDarkMode
            ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
            : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500',
        outlined: isDarkMode
            ? 'bg-transparent border-2 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
            : 'bg-transparent border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500',
        filled: isDarkMode
            ? 'bg-gray-700 border-b-2 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-t-lg rounded-b-none'
            : 'bg-gray-50 border-b-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 rounded-t-lg rounded-b-none'
    };

    const stateClasses = error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : success
            ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
            : '';

    const widthClass = fullWidth ? 'w-full' : '';

    const resizeClasses = {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize'
    };

    const textareaClasses = [
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        stateClasses,
        widthClass,
        resizeClasses[resize],
        className
    ].filter(Boolean).join(' ');

    const containerClasses = fullWidth ? 'w-full' : '';

    return (
        <div className={containerClasses}>
            {label && (
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {label}
                </label>
            )}

            <textarea
                className={textareaClasses}
                {...props}
            />

            {helperText && (
                <p className={`mt-1 text-sm ${error
                    ? 'text-red-600 dark:text-red-400'
                    : success
                        ? 'text-green-600 dark:text-green-400'
                        : isDarkMode
                            ? 'text-gray-400'
                            : 'text-gray-500'
                    }`}>
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default Textarea; 