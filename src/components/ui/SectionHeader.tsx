import React from 'react';
import { IconType } from 'react-icons';

export interface SectionHeaderProps {
    icon: IconType;
    title: string;
    description?: string;
    variant?: 'default' | 'gradient';
    color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'emerald' | 'teal' | 'cyan';
    actions?: React.ReactNode;
    badges?: React.ReactNode;
    className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
    icon: Icon,
    title,
    description,
    variant = 'gradient',
    color = 'blue',
    actions,
    badges,
    className = ''
}) => {

    const colorClasses = {
        blue: {
            gradient: 'from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
            border: 'border-blue-100 dark:border-gray-600',
            iconBg: 'from-blue-500 to-indigo-600',
            titleGradient: 'from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400',
            backgroundPattern: 'bg-blue-500'
        },
        green: {
            gradient: 'from-green-50 via-emerald-50 to-teal-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
            border: 'border-green-100 dark:border-gray-600',
            iconBg: 'from-green-500 to-emerald-600',
            titleGradient: 'from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400',
            backgroundPattern: 'bg-green-500'
        },
        red: {
            gradient: 'from-red-50 via-rose-50 to-pink-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
            border: 'border-red-100 dark:border-gray-600',
            iconBg: 'from-red-500 to-rose-600',
            titleGradient: 'from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400',
            backgroundPattern: 'bg-red-500'
        },
        orange: {
            gradient: 'from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
            border: 'border-orange-100 dark:border-gray-600',
            iconBg: 'from-orange-500 to-amber-600',
            titleGradient: 'from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400',
            backgroundPattern: 'bg-orange-500'
        },
        purple: {
            gradient: 'from-purple-50 via-violet-50 to-indigo-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
            border: 'border-purple-100 dark:border-gray-600',
            iconBg: 'from-purple-500 to-violet-600',
            titleGradient: 'from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400',
            backgroundPattern: 'bg-purple-500'
        },
        emerald: {
            gradient: 'from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
            border: 'border-emerald-100 dark:border-gray-600',
            iconBg: 'from-emerald-500 to-teal-600',
            titleGradient: 'from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400',
            backgroundPattern: 'bg-emerald-500'
        },
        teal: {
            gradient: 'from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
            border: 'border-teal-100 dark:border-gray-600',
            iconBg: 'from-teal-500 to-cyan-600',
            titleGradient: 'from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400',
            backgroundPattern: 'bg-teal-500'
        },
        cyan: {
            gradient: 'from-cyan-50 via-sky-50 to-blue-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
            border: 'border-cyan-100 dark:border-gray-600',
            iconBg: 'from-cyan-500 to-sky-600',
            titleGradient: 'from-cyan-600 to-sky-600 dark:from-cyan-400 dark:to-sky-400',
            backgroundPattern: 'bg-cyan-500'
        }
    };

    const colorTheme = colorClasses[color];

    if (variant === 'gradient') {
        return (
            <div className={`overflow-hidden relative p-6 bg-gradient-to-br ${colorTheme.gradient} rounded-2xl border ${colorTheme.border} shadow-lg ${className}`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 dark:opacity-10">
                    <div className={`absolute top-0 right-0 w-32 h-32 ${colorTheme.backgroundPattern} rounded-full translate-x-16 -translate-y-16`}></div>
                    <div className={`absolute bottom-0 left-0 w-24 h-24 ${colorTheme.backgroundPattern} rounded-full -translate-x-12 translate-y-12`}></div>
                </div>

                <div className="flex relative flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Title and Description */}
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 bg-gradient-to-br ${colorTheme.iconBg} rounded-xl shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${colorTheme.titleGradient}`}>
                                {title}
                            </h2>
                            {description && (
                                <p className="text-gray-600 dark:text-gray-300 mt-1">
                                    {description}
                                </p>
                            )}
                            {badges && (
                                <div className="flex items-center mt-2 space-x-2">
                                    {badges}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    {actions && (
                        <div className="flex items-center space-x-3">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700 ${className}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Title and Description */}
                <div className="flex items-center space-x-4">
                    <div className={`p-3 bg-gradient-to-br ${colorTheme.iconBg} rounded-xl shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {title}
                        </h2>
                        {description && (
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                                {description}
                            </p>
                        )}
                        {badges && (
                            <div className="flex items-center mt-2 space-x-2">
                                {badges}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex items-center space-x-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SectionHeader; 