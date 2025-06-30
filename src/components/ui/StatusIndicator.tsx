import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface StatusIndicatorProps {
    status: 'idle' | 'loading' | 'success' | 'error' | 'warning' | 'info';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    label?: string;
    className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
    status,
    size = 'md',
    showLabel = false,
    label,
    className = ''
}) => {
    const { isDarkMode } = useTheme();

    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    };

    const statusClasses = {
        idle: isDarkMode ? 'bg-gray-500' : 'bg-gray-400',
        loading: 'animate-pulse bg-blue-500',
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    const labelClasses = {
        idle: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        loading: 'text-blue-600 dark:text-blue-400',
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        info: 'text-blue-600 dark:text-blue-400'
    };

    const getLabel = () => {
        if (label) return label;
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const getIcon = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
                );
            case 'success':
                return (
                    <div className={`${sizeClasses[size]} rounded-full ${statusClasses[status]}`} />
                );
            case 'error':
                return (
                    <div className={`${sizeClasses[size]} rounded-full ${statusClasses[status]}`} />
                );
            case 'warning':
                return (
                    <div className={`${sizeClasses[size]} rounded-full ${statusClasses[status]}`} />
                );
            case 'info':
                return (
                    <div className={`${sizeClasses[size]} rounded-full ${statusClasses[status]}`} />
                );
            default:
                return (
                    <div className={`${sizeClasses[size]} rounded-full ${statusClasses[status]}`} />
                );
        }
    };

    return (
        <div className={`inline-flex items-center space-x-2 ${className}`}>
            {getIcon()}
            {showLabel && (
                <span className={`text-sm font-medium ${labelClasses[status]}`}>
                    {getLabel()}
                </span>
            )}
        </div>
    );
};

export default StatusIndicator; 