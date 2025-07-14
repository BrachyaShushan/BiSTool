import React from 'react';
import { IconType } from 'react-icons';
import IconWrapper from './IconWrapper';

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
        default: 'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500 text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500',
        ghost: 'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500 text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500',
        outline: 'dark:text-gray-300 dark:bg-transparent dark:border dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500 dark:focus:ring-gray-500 text-gray-700 bg-transparent border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500',
        primary: 'dark:text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500 text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        success: 'dark:text-white dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-500 text-white bg-green-600 hover:bg-green-700 focus:ring-green-500',
        danger: 'dark:text-white dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-500 text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'dark:text-white dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-500 text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
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
                <IconWrapper
                    icon={Icon}
                    size={size}
                    className="transition-transform duration-200 group-hover:scale-110"
                />
            )}
            {children}
        </button>
    );
};

export default IconButton; 