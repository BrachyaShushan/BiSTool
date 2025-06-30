import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface CardProps {
    variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    interactive?: boolean;
}

const Card: React.FC<CardProps> = ({
    variant = 'default',
    padding = 'md',
    children,
    className = '',
    onClick,
    interactive = false
}) => {
    const { isDarkMode } = useTheme();

    const baseClasses = 'rounded-xl transition-all duration-200';

    const variantClasses = {
        default: isDarkMode
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white border border-gray-200',
        elevated: isDarkMode
            ? 'bg-gray-800 border border-gray-700 shadow-lg shadow-gray-900/50'
            : 'bg-white border border-gray-200 shadow-lg shadow-gray-200/50',
        outlined: isDarkMode
            ? 'bg-transparent border-2 border-gray-600'
            : 'bg-transparent border-2 border-gray-300',
        gradient: isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 border border-gray-600'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200'
    };

    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8'
    };

    const interactiveClasses = interactive || onClick
        ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg'
        : '';

    const classes = [
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        interactiveClasses,
        className
    ].filter(Boolean).join(' ');

    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            className={classes}
            onClick={onClick}
            type={onClick ? 'button' : undefined}
        >
            {children}
        </Component>
    );
};

export default Card; 