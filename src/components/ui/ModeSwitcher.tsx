import React from 'react';
import { FiZap, FiSettings } from 'react-icons/fi';

export interface ModeSwitcherProps {
    mode: 'basic' | 'expert';
    onModeChange: (mode: 'basic' | 'expert') => void;
    className?: string;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
    mode,
    onModeChange,
    className = ''
}) => {
    return (
        <div className={`inline-flex relative items-center justify-between p-0.5 sm:p-1 bg-gray-100 rounded-lg shadow-inner dark:bg-gray-700 ${className}`}>
            {/* Background slider */}
            <div
                className={`absolute top-0.5 sm:top-1 bottom-0.5 sm:bottom-1 w-[calc(50%-2px)] sm:w-[calc(50%-4px)] bg-white dark:bg-gray-600 rounded-md shadow-sm transition-all duration-300 ease-out ${mode === 'expert' ? 'translate-x-full' : 'translate-x-0'
                    }`}
            />

            {/* Basic Mode Button */}
            <button
                onClick={() => onModeChange('basic')}
                className={`relative z-10 flex justify-center items-center space-x-1 w-full sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 min-w-0 ${mode === 'basic'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
            >
                <FiZap className={`w-3 h-3 sm:w-4 sm:h-4 transition-all duration-200 flex-shrink-0 ${mode === 'basic' ? 'text-blue-500' : 'text-gray-500'
                    }`} />
                <span >Basic</span>
            </button>

            {/* Expert Mode Button */}
            <button
                onClick={() => onModeChange('expert')}
                className={`relative z-10 flex justify-center items-center space-x-1 w-full sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 min-w-0 ${mode === 'expert'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
            >
                <FiSettings className={`w-3 h-3 sm:w-4 sm:h-4 transition-all duration-200 flex-shrink-0 ${mode === 'expert' ? 'text-purple-500' : 'text-gray-500'
                    }`} />
                <span >Expert</span>
            </button>
        </div>
    );
};

export default ModeSwitcher; 