import React from 'react';
import { FiCheck, FiX, FiClock, FiRefreshCw } from 'react-icons/fi';
import IconWrapper from './IconWrapper';

export interface TestStatusBadgeProps {
    status: 'pass' | 'fail' | 'pending' | 'running' | null;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    className?: string;
}

const TestStatusBadge: React.FC<TestStatusBadgeProps> = ({
    status,
    size = 'md',
    showIcon = true,
    className = ''
}) => {

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs space-x-1',
        md: 'px-3 py-1 text-sm space-x-1',
        lg: 'px-4 py-1.5 text-base space-x-2'
    };



    const getStatusConfig = () => {
        switch (status) {
            case 'pass':
                return {
                    bgColor: 'bg-green-100 dark:bg-green-900',
                    textColor: 'text-green-800 dark:text-green-200',
                    icon: FiCheck,
                    label: 'Passed'
                };
            case 'fail':
                return {
                    bgColor: 'bg-red-100 dark:bg-red-900',
                    textColor: 'text-red-800 dark:text-red-200',
                    icon: FiX,
                    label: 'Failed'
                };
            case 'running':
                return {
                    bgColor: 'bg-blue-100 dark:bg-blue-900',
                    textColor: 'text-blue-800 dark:text-blue-200',
                    icon: FiRefreshCw,
                    label: 'Running'
                };
            case 'pending':
                return {
                    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
                    textColor: 'text-yellow-800 dark:text-yellow-200',
                    icon: FiClock,
                    label: 'Pending'
                };
            default:
                return {
                    bgColor: 'bg-gray-100 dark:bg-gray-700',
                    textColor: 'text-gray-600 dark:text-gray-300',
                    icon: FiClock,
                    label: 'Not Run'
                };
        }
    };

    const statusConfig = getStatusConfig();
    const Icon = statusConfig.icon;

    return (
        <div className={`inline-flex items-center font-semibold rounded-lg ${sizeClasses[size]} ${statusConfig.bgColor} ${statusConfig.textColor} ${className}`}>
            {showIcon && (
                <IconWrapper
                    icon={Icon}
                    size={size}
                    className={status === 'running' ? 'animate-spin' : ''}
                />
            )}
            <span>{statusConfig.label}</span>
        </div>
    );
};

export default TestStatusBadge; 