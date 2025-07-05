import React from 'react';
import { IconType } from 'react-icons';

export interface StatCardProps {
    icon: IconType;
    label: string;
    value: string | number;
    color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    icon: Icon,
    label,
    value,
    color = 'blue',
    className = ''
}) => {

    const colorClasses = {
        blue: {
            gradient: 'from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800',
            border: 'border-blue-200 dark:border-blue-700',
            icon: 'text-blue-600 dark:text-blue-400',
            label: 'text-blue-700 dark:text-blue-300',
            value: 'text-blue-800 dark:text-blue-200'
        },
        green: {
            gradient: 'from-green-50 to-green-100 dark:from-green-900 dark:to-green-800',
            border: 'border-green-200 dark:border-green-700',
            icon: 'text-green-600 dark:text-green-400',
            label: 'text-green-700 dark:text-green-300',
            value: 'text-green-800 dark:text-green-200'
        },
        red: {
            gradient: 'from-red-50 to-red-100 dark:from-red-900 dark:to-red-800',
            border: 'border-red-200 dark:border-red-700',
            icon: 'text-red-600 dark:text-red-400',
            label: 'text-red-700 dark:text-red-300',
            value: 'text-red-800 dark:text-red-200'
        },
        orange: {
            gradient: 'from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800',
            border: 'border-orange-200 dark:border-orange-700',
            icon: 'text-orange-600 dark:text-orange-400',
            label: 'text-orange-700 dark:text-orange-300',
            value: 'text-orange-800 dark:text-orange-200'
        },
        purple: {
            gradient: 'from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800',
            border: 'border-purple-200 dark:border-purple-700',
            icon: 'text-purple-600 dark:text-purple-400',
            label: 'text-purple-700 dark:text-purple-300',
            value: 'text-purple-800 dark:text-purple-200'
        },
        gray: {
            gradient: 'from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800',
            border: 'border-gray-200 dark:border-gray-700',
            icon: 'text-gray-600 dark:text-gray-400',
            label: 'text-gray-700 dark:text-gray-300',
            value: 'text-gray-800 dark:text-gray-200'
        }
    };

    const colorTheme = colorClasses[color];

    return (
        <div className={`p-4 bg-gradient-to-r ${colorTheme.gradient} rounded-xl border ${colorTheme.border} transition-all duration-200 hover:shadow-md ${className}`}>
            <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${colorTheme.icon}`} />
                <span className={`text-sm font-semibold ${colorTheme.label}`}>{label}</span>
            </div>
            <p className={`text-2xl font-bold ${colorTheme.value} mt-1`}>{value}</p>
        </div>
    );
};

export default StatCard; 