import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface DividerProps {
    orientation?: 'horizontal' | 'vertical';
    variant?: 'solid' | 'dashed' | 'dotted';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Divider: React.FC<DividerProps> = ({
    orientation = 'horizontal',
    variant = 'solid',
    size = 'md',
    className = ''
}) => {
    const { isDarkMode } = useTheme();

    const baseClasses = 'transition-colors duration-200';

    const orientationClasses = {
        horizontal: 'w-full',
        vertical: 'h-full'
    };

    const sizeClasses = {
        sm: orientation === 'horizontal' ? 'h-px' : 'w-px',
        md: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
        lg: orientation === 'horizontal' ? 'h-1' : 'w-1'
    };

    const variantClasses = {
        solid: isDarkMode ? 'bg-gray-600' : 'bg-gray-300',
        dashed: isDarkMode ? 'border-dashed border-gray-600' : 'border-dashed border-gray-300',
        dotted: isDarkMode ? 'border-dotted border-gray-600' : 'border-dotted border-gray-300'
    };

    const classes = [
        baseClasses,
        orientationClasses[orientation],
        sizeClasses[size],
        variantClasses[variant],
        className
    ].filter(Boolean).join(' ');

    return <div className={classes} />;
};

export default Divider; 