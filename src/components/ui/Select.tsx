import React, { useState, useRef, useEffect } from 'react';
import { IconType } from 'react-icons';
import { FiChevronDown } from 'react-icons/fi';
import IconWrapper from './IconWrapper';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    icon?: string | IconType;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'size' | 'onChange'> {
    variant?: 'default' | 'outlined' | 'filled';
    size?: 'sm' | 'md' | 'lg';
    icon?: IconType;
    error?: boolean;
    success?: boolean;
    fullWidth?: boolean;
    label?: string;
    helperText?: string;
    options: SelectOption[];
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    'data-testid'?: string;
}

const Select: React.FC<SelectProps> = ({
    variant = 'default',
    size = 'md',
    icon: Icon,
    error = false,
    success = false,
    fullWidth = false,
    label,
    helperText,
    options,
    placeholder,
    value,
    onChange,
    className = '',
    'data-testid': dataTestId,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedValue(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        if (onChange) {
            onChange(optionValue);
        }
        setSelectedValue(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(option => option.value === selectedValue);

    const baseClasses = 'rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer';

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
        default: 'dark:bg-gray-700 border dark:border-gray-600 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-white border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500',
        outlined: 'dark:bg-transparent dark:border-2 dark:border-gray-600 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-transparent border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500',
        filled: 'dark:bg-gray-700 dark:border-b-2 dark:border-gray-600 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 border-b-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 rounded-t-lg rounded-b-none'
    };

    const stateClasses = error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : success
            ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
            : '';

    const widthClass = fullWidth ? 'w-full' : '';

    const iconClasses = Icon ? 'pl-10' : '';

    const selectClasses = [
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        stateClasses,
        widthClass,
        iconClasses,
        className
    ].filter(Boolean).join(' ');

    const containerClasses = fullWidth ? 'w-full' : '';

    return (
        <div className={containerClasses} ref={dropdownRef} {...props}>
            {label && (
                <label className={`block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200`}>
                    {label}
                </label>
            )}

            <div className="relative">
                {Icon && (
                    <div className={`absolute left-3 top-1/2 z-10 text-gray-500 transform -translate-y-1/2 dark:text-gray-400`}>
                        <IconWrapper icon={Icon} size="sm" />
                    </div>
                )}

                <div
                    className={selectClasses}
                    onClick={() => setIsOpen(!isOpen)}
                    data-testid={dataTestId}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex flex-1 gap-2 items-center min-w-0">
                            {selectedOption?.icon && (
                                <IconWrapper
                                    icon={selectedOption.icon}
                                    size="sm"
                                    variant="colored"
                                    preserveColors={true}
                                />
                            )}
                            <span className="truncate">
                                {selectedOption ? selectedOption.label : placeholder || 'Select an option'}
                            </span>
                        </div>
                        <IconWrapper
                            icon={FiChevronDown}
                            size="sm"
                            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </div>
                </div>

                {isOpen && (
                    <div className="overflow-auto absolute z-50 mt-1 w-full max-h-60 bg-white rounded-lg border border-gray-300 shadow-lg dark:bg-gray-700 dark:border-gray-600">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150 ${option.value === selectedValue
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-900 dark:text-white'
                                    } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => !option.disabled && handleSelect(option.value)}
                            >
                                <div className="flex gap-2 items-center">
                                    {option.icon && (
                                        <IconWrapper
                                            icon={option.icon}
                                            size="sm"
                                            variant="colored"
                                            preserveColors={true}
                                        />
                                    )}
                                    <span className="truncate">{option.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {helperText && (
                <p className={`mt-1 text-sm ${error
                    ? 'text-red-600 dark:text-red-400'
                    : success
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default Select; 