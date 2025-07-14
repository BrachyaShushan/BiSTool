import React from 'react';
import IconWrapper, { IconWrapperProps } from './IconWrapper';

export interface OptionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: IconWrapperProps['icon'];
    label: string;
    description?: string;
    color?: string;
    selected?: boolean;
    compact?: boolean;
    children?: React.ReactNode;
}

const colorMap = (color: string) => {
    return {
        bg: `bg-${color}-500`,
        indicator: `bg-${color}-200`,
        indicatorInner: `bg-${color}-600`,
        selected: `bg-gradient-to-r from-${color}-600 to-${color}-700 text-white border-transparent`,
        unselected: `bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-600`,
    }
}

const OptionButton: React.FC<OptionButtonProps> = ({
    icon,
    label,
    description,
    color = 'blue',
    selected = false,
    compact = false,
    className = '',
    children,
    ...props
}) => {
    const colorTheme = colorMap(color);
    const selectedClass = colorTheme.selected;
    const unselectedClass = colorTheme.unselected;

    return (
        <button
            type="button"
            className={`relative ${compact ? 'p-2' : 'p-3'} rounded-lg border-2 transition-all duration-300 transform hover:scale-105 group overflow-hidden focus:outline-none ${selected ? selectedClass : unselectedClass} ${className}`}
            aria-pressed={selected}
            {...props}
        >
            {/* Background Pattern */}
            <div className={`absolute inset-0 opacity-5 transition-opacity duration-300 ${selected ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'}`}>
                <div className={`absolute top-0 right-0 w-8 h-8 rounded-full translate-x-4 -translate-y-4 ${colorTheme.bg}`}></div>
            </div>

            <div className="flex relative z-10 flex-col items-center space-y-1 text-center">
                <IconWrapper icon={icon} size={compact ? 'sm' : 'lg'} variant="colored" className={`transition-transform duration-300 ${selected ? 'scale-110' : 'group-hover:scale-105'}`} />
                <div>
                    <h4 className={`font-semibold ${compact ? 'text-xs' : 'text-xs'} ${selected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{label}</h4>
                    {!compact && description && (
                        <p className={`text-xs ${selected ? 'text-gray-100 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>{description}</p>
                    )}
                </div>
                {children}
            </div>

            {/* Selection Indicator */}
            {selected && (
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${colorTheme.indicator} flex items-center justify-center`}>
                    <div className={`w-1 h-1 rounded-full ${colorTheme.indicatorInner}`}></div>
                </div>
            )}
        </button>
    );
};

export default OptionButton; 