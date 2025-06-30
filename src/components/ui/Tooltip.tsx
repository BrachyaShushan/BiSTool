import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface TooltipProps {
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
    content,
    position = 'top',
    children,
    className = '',
    delay = 200
}) => {
    const { isDarkMode } = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<number | undefined>(undefined);

    const showTooltip = () => {
        timeoutRef.current = window.setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 dark:border-t-gray-200',
        bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 dark:border-b-gray-200',
        left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 dark:border-l-gray-200',
        right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 dark:border-r-gray-200'
    };

    return (
        <div
            className={`relative inline-block ${className}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}

            {isVisible && (
                <div
                    className={`absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-gray-200 dark:text-gray-800 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}
                >
                    {content}
                    <div className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`} />
                </div>
            )}
        </div>
    );
};

export default Tooltip; 